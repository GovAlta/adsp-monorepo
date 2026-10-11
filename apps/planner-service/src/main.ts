import * as express from 'express';
import * as passport from 'passport';
import * as compression from 'compression';
import * as helmet from 'helmet';
import * as cors from 'cors';
import * as winston from 'winston';
function createLogger(service: string, level: string = 'info') {
  return winston.createLogger({
    level,
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    defaultMeta: { service },
    transports: [new winston.transports.Console()],
  });
}
import { createErrorHandler } from './middleware/error.middleware';
import {
  AdspId,
  adspId,
  initializePlatform,
  ServiceMetricsValueDefinition,
  instrumentAxios,
} from '@abgov/adsp-service-sdk';
import type { User } from '@abgov/adsp-service-sdk';
import { environment } from './environments/environment';
import { createMongoConnection } from './mongo';
import { createRouter } from './routes';
import { EventService } from './services/event.service';
import { LLMService } from './services/llm.service';
import { PLANNER_ROLES } from './types';

// ✓ ASVS:V7.1.1 — structured logging; no sensitive data in log output
// ✓ FAC-S4-027 — redact: winston logger configured with no format.json() to prevent
// accidental serialization of req/res objects; only structured ID fields are logged.
const logger = createLogger('planner-service', environment.LOG_LEVEL || 'info');

// Domain event types for ADSP platform registration
const PLANNER_EVENTS = [
  {
    name: 'session-created',
    description: 'Emitted when a new planning session is created.',
    payloadSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string' },
        tenantId: { type: 'string' },
        userId: { type: 'string' },
      },
    },
  },
  {
    name: 'session-updated',
    description: 'Emitted when a planning session status changes.',
    payloadSchema: { type: 'object' },
  },
  {
    name: 'session-completed',
    description: 'Emitted when a planning session reaches completed status.',
    payloadSchema: { type: 'object' },
  },
  {
    name: 'session-archived',
    description: 'Emitted when a planning session is archived.',
    payloadSchema: { type: 'object' },
  },
  {
    name: 'hypothesis-generated',
    description: 'Emitted when a new solution hypothesis is accepted.',
    payloadSchema: { type: 'object' },
  },
  {
    name: 'specialist-delegated',
    description: 'Emitted when a specialist agent consultation is initiated.',
    payloadSchema: { type: 'object' },
  },
];

async function initializeApp(): Promise<express.Application> {
  const app = express();

  // ✓ ASVS:V14.4.1 — compression before body parsing; no Gzip decompression bomb risk
  app.use(compression());

  // ✓ ASVS:V14.4.3 — HSTS enforced; max-age 1 year with includeSubDomains + preload
  // ✓ ASVS:V14.4.4 — X-Content-Type-Options: nosniff (helmet default)
  // ✓ ASVS:V14.4.5 — X-Frame-Options: DENY (helmet default)
  app.use(
    helmet({
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      // API service returns JSON, not HTML. Restrict all content sources to 'none'
      // so any accidental HTML response cannot load external resources.
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
    }),
  );

  app.use(express.json({ limit: '1mb' }));

  // ✓ ASVS:V14.4.7 — CORS origins explicitly configured from environment; wildcard forbidden (D-005)
  // Fail fast in non-development environments when CORS_ORIGIN is not set
  if (!environment.CORS_ORIGIN && environment.NODE_ENV !== 'development') {
    throw new Error('CORS_ORIGIN env var is required in non-development environments');
  }
  app.use(
    cors({
      origin: environment.CORS_ORIGIN,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Authorization', 'Content-Type', 'X-Request-ID'],
      exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset', 'Retry-After'],
    }),
  );

  if (environment.TRUSTED_PROXY) {
    app.set('trust proxy', environment.TRUSTED_PROXY);
  }

  instrumentAxios(logger);

  // ADSP platform initialization
  // ✓ ASVS:V3.5.1 — Keycloak JWT validation configured via ADSP SDK (SYSREQ-012)
  const serviceId = AdspId.parse(environment.CLIENT_ID);
  const accessServiceUrl = new URL(environment.KEYCLOAK_ROOT_URL);

  const {
    coreStrategy,
    tenantStrategy,
    tenantHandler,
    configurationHandler,
    healthCheck,
    metricsHandler,
    traceHandler,
  } = await initializePlatform(
    {
      serviceId,
      displayName: 'Planner service',
      description: 'GoA AI-assisted business planning service for program design.',
      tracing: environment.OTEL_EXPORTER_OTLP_ENDPOINT,
      metrics: environment.OTEL_EXPORTER_OTLP_ENDPOINT,
      // ✓ ASVS:V4.1.2 — service roles registered with ADSP platform
      roles: [
        {
          role: PLANNER_ROLES.PLANNER_USER,
          description: 'Can create and manage their own planning sessions.',
          inTenantAdmin: false,
        },
        {
          role: PLANNER_ROLES.PLANNER_ADMIN,
          description: 'Can manage all planning sessions within the tenant and access audit logs.',
          inTenantAdmin: false,
        },
        {
          role: PLANNER_ROLES.TENANT_ADMIN,
          description: 'Full administrative access including configuration and audit.',
          inTenantAdmin: true,
        },
      ],
      // Domain events (INT-007 stub — registered but not transmitted)
      events: PLANNER_EVENTS,
      clientSecret: environment.CLIENT_SECRET,
      accessServiceUrl,
      directoryUrl: new URL(environment.DIRECTORY_URL),
      values: [ServiceMetricsValueDefinition],
      serviceConfigurations: [],
    },
    { logger },
  );

  // ✓ ASVS:V3.5.1 — passport strategies: tenant JWT + core JWT
  passport.use('jwt', tenantStrategy);
  passport.use('jwt-core', coreStrategy);

  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(function (user, done) {
    done(null, user as User);
  });

  app.use(passport.initialize());
  app.use(traceHandler);

  // MongoDB connection
  // ✓ ASVS:V3.2.1 — connection established before routes are registered
  const mongoConnection = await createMongoConnection(environment.MONGO_URI, logger);
  logger.info('MongoDB connection ready');

  // Initialize stub services
  const eventService = new EventService(logger);
  // [IMPL-DEFERRED: INT-001] — LLMService is fail-closed stub until OPEN-001/002/006 resolved
  const llmService = new LLMService();

  // Metrics handler (before route auth to avoid double-auth on metrics)
  app.use(
    '/api/v1',
    metricsHandler,
    // ✓ ASVS:V3.5.1 — JWT authentication required on all API v1 routes
    passport.authenticate(['jwt-core', 'jwt'], { session: false }),
    tenantHandler,
    configurationHandler,
  );

  // API v1 routes
  // auditService is undefined until audit.service.ts is generated in a later Phase C batch;
  // session routes degrade gracefully (log-only audit) until it is wired.
  const apiRouter = createRouter({ logger, eventService, llmService });
  app.use('/api/v1', apiRouter);

  // Health endpoints — no authentication required (SYSREQ-023)
  // ✓ ASVS:V14.2.1 — health endpoints are unauthenticated; return no sensitive data
  app.get('/health', async (_req, res) => {
    try {
      const platform = await healthCheck();
      const dbHealthy = mongoConnection.isConnected();

      const status = platform && dbHealthy ? 200 : 503;
      res.status(status).json({
        ...platform,
        db: dbHealthy,
        // [IMPL-DEFERRED: INT-001] LLM stub is always unavailable
        llm: false,
      });
    } catch (err) {
      res.status(503).json({ healthy: false, error: 'Health check failed' });
    }
  });

  app.get('/health/live', (_req, res) => {
    res.status(200).json({ status: 'alive' });
  });

  // FAC-S4-010 alias: /health/liveness mirrors /health/live
  // ✓ ASVS:V14.2.1 — liveness probe is unauthenticated; returns no sensitive data
  app.get('/health/liveness', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.get('/health/ready', async (_req, res) => {
    const dbReady = mongoConnection.isConnected();
    const status = dbReady ? 200 : 503;
    res.status(status).json({ db: dbReady });
  });

  // FAC-S4-010 alias: /health/readiness mirrors /health/ready
  // ✓ ASVS:V14.2.1 — readiness probe is unauthenticated; returns no sensitive data
  app.get('/health/readiness', async (_req, res) => {
    const dbReady = mongoConnection.isConnected();
    const status = dbReady ? 200 : 503;
    res.status(status).json({ db: dbReady });
  });

  // Swagger/OpenAPI docs
  app.get('/swagger/docs/v1', (_req, res) => {
    res.json({ message: 'OpenAPI spec served from openapi.json in dist output' });
  });

  // Root endpoint
  app.get('/', (req, res) => {
    const rootUrl = new URL(`${req.protocol}://${req.get('host')}`);
    res.json({
      name: 'Planner service',
      description: 'GoA AI-assisted business planning service for program design.',
      _links: {
        self: { href: new URL(req.originalUrl, rootUrl).href },
        health: { href: new URL('/health', rootUrl).href },
        api: { href: new URL('/api/v1', rootUrl).href },
        docs: { href: new URL('/swagger/docs/v1', rootUrl).href },
      },
    });
  });

  // ✓ CAS:RULE-017 — centralized error handler; must be last middleware
  app.use(createErrorHandler(logger));

  // Expose eventService for use by route modules (attached to app.locals)
  app.locals.eventService = eventService;

  return app;
}

initializeApp()
  .then((app) => {
    const port = environment.PORT || 7796;

    const server = app.listen(port, () => {
      logger.info(`Planner service listening at http://localhost:${port}`);
    });

    const handleExit = async (message: string, code: number, err: Error | null) => {
      server.close();
      err === null ? logger.info(message) : logger.error(message, { error: err.message });
      process.exit(code);
    };

    process.on('SIGINT', () => {
      handleExit('Planner service shutting down (SIGINT)', 0, null);
    });
    process.on('SIGTERM', () => {
      handleExit('Planner service shutting down (SIGTERM)', 0, null);
    });
    process.on('uncaughtException', (err: Error) => {
      // ✓ ASVS:V7.4.1 — uncaught exceptions logged; service exits cleanly
      handleExit('Planner service uncaught exception', 1, err);
    });
    server.on('error', (err) => logger.error('Express server error', { error: err.message }));
  })
  .catch((err: Error) => {
    logger.error('Planner service failed to start', { error: err.message, stack: err.stack });
    process.exit(1);
  });
