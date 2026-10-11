/**
 * test-app.ts — Creates a testable Express application for cross-system E2E tests.
 *
 * This factory bypasses the ADSP platform initializePlatform() call (which requires
 * live Keycloak / ADSP credentials) and substitutes a direct passport-jwt strategy
 * that validates RS256 tokens signed by the test RSA keypair from test-jwt-factory.ts.
 *
 * INT-008 (Keycloak JWT): replaced by passport-jwt + test public key in E2E context.
 * INT-007 (ADSP RabbitMQ): EventService stub is used (fire-and-forget, no live broker).
 * INT-001 (Anthropic Claude): LLMService stub is used (fail-closed, no live API calls).
 * INT-002 (ADSP Config): ConfigService/PatternsService stub is used (lookup-empty).
 * INT-003..INT-006 (Specialist Agents): SpecialistsService stub is used (fail-closed).
 *
 * The MongoDB connection is injected at creation time (Testcontainers provides the URI).
 * Rule 15: mongoUri comes from Testcontainers at runtime — never a literal secret.
 */
import * as express from 'express';
import * as passport from 'passport';
import * as cors from 'cors';
import * as helmet from 'helmet';
import * as compression from 'compression';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import * as winston from 'winston';
import { createRouter } from '../../apps/planner-service/src/routes';
import { EventService } from '../../apps/planner-service/src/services/event.service';
import { LLMService } from '../../apps/planner-service/src/services/llm.service';
import { AuditEventService } from '../../apps/planner-service/src/services/audit.service';
import { createErrorHandler } from '../../apps/planner-service/src/middleware/error.middleware';
import { createMongoConnection, MongoConnection } from '../../apps/planner-service/src/mongo';

// ---------------------------------------------------------------------------
// Logger (minimal — E2E output stays clean)
// ---------------------------------------------------------------------------

function createTestLogger() {
  return winston.createLogger({
    level: 'warn',
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    defaultMeta: { service: 'planner-service-e2e' },
    transports: [new winston.transports.Console()],
    silent: process.env.E2E_LOG_SILENT === 'true',
  });
}

// ---------------------------------------------------------------------------
// TestApp handle — returned to callers for teardown
// ---------------------------------------------------------------------------

export interface TestApp {
  app: express.Application;
  mongoConnection: MongoConnection;
  teardown(): Promise<void>;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * createTestApp — creates a fully-wired Express app connected to the given
 * MongoDB URI with a test JWT strategy that accepts tokens signed by testPublicKey.
 *
 * @param mongoUri      Testcontainers-provided MongoDB connection URI (runtime value).
 * @param testPublicKey PEM-encoded RSA public key from test-jwt-factory.getTestPublicKey().
 */
export async function createTestApp(
  mongoUri: string,
  testPublicKey: string,
): Promise<TestApp> {
  const app = express() as express.Application;
  const logger = createTestLogger();

  // ── Middleware ──────────────────────────────────────────────────────────
  app.use(compression());
  app.use(
    helmet({
      hsts: { maxAge: 0 }, // relaxed for test
      contentSecurityPolicy: false,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'] }));

  // ── Passport JWT strategy (INT-008 test stub) ───────────────────────────
  // The strategy validates RS256 tokens signed by the test keypair and
  // populates req.user with { tenantId, userId, roles } for downstream
  // requireAuth / tenantMiddleware checks.
  const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: testPublicKey,
    algorithms: ['RS256' as const],
  };

  passport.use(
    new JwtStrategy(jwtOptions, (payload, done) => {
      if (!payload.userId || !payload.tenantId) {
        return done(null, false);
      }
      done(null, {
        tenantId: payload.tenantId as string,
        userId: payload.userId as string,
        roles: (payload.roles as string[]) || [],
        displayName: payload.displayName as string | undefined,
        email: payload.email as string | undefined,
      });
    }),
  );

  app.use(passport.initialize());

  // ── Apply JWT authentication on all /api/v1 routes ─────────────────────
  app.use('/api/v1', passport.authenticate('jwt', { session: false }));

  // ── MongoDB (Testcontainers-provided URI; Rule 15 — URI is a param, not literal) ─
  const mongoConnection = await createMongoConnection(mongoUri, logger);

  // ── Services ────────────────────────────────────────────────────────────
  const eventService = new EventService(logger);
  const llmService = new LLMService();
  const signingKey = process.env.AUDIT_SIGNING_KEY || 'test-audit-signing-key-e2e';
  const auditService = new AuditEventService(signingKey, logger);

  // ── API Routes ──────────────────────────────────────────────────────────
  const apiRouter = createRouter({ logger, eventService, llmService, auditService });
  app.use('/api/v1', apiRouter);

  // ── Health endpoint (no auth) ────────────────────────────────────────────
  app.get('/health/live', (_req, res) => res.status(200).json({ status: 'alive' }));
  app.get('/health/ready', (_req, res) =>
    res.status(mongoConnection.isConnected() ? 200 : 503).json({ db: mongoConnection.isConnected() }),
  );

  // ── Error handler (must be last) ─────────────────────────────────────────
  app.use(createErrorHandler(logger));

  return {
    app,
    mongoConnection,
    async teardown() {
      await mongoConnection.disconnect();
    },
  };
}
