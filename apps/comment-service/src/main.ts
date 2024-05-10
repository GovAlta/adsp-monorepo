import * as express from 'express';
import { readFile } from 'fs';
import { promisify } from 'util';
import * as passport from 'passport';
import * as compression from 'compression';
import * as cors from 'cors';
import * as helmet from 'helmet';
import { AdspId, ServiceMetricsValueDefinition, initializePlatform } from '@abgov/adsp-service-sdk';
import type { User } from '@abgov/adsp-service-sdk';
import { createLogger, createErrorHandler } from '@core-services/core-common';
import { environment } from './environments/environment';
import {
  CommentCreatedEventDefinition,
  CommentDeletedEventDefinition,
  CommentUpdatedEventDefinition,
  ServiceRoles,
  TopicCreatedEventDefinition,
  TopicDeletedEventDefinition,
  TopicType,
  TopicUpdatedEventDefinition,
  applyCommentMiddleware,
} from './comment';
import { CommentConfigurationSchema } from './comment/configuration';
import { TopicTypeEntity } from './comment/model/type';
import { createRepositories } from './postgres';

const logger = createLogger('comment-service', environment.LOG_LEVEL);

const initializeApp = async (): Promise<express.Application> => {
  const app = express();

  app.use(compression());
  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));
  app.use(cors());

  if (environment.TRUSTED_PROXY) {
    app.set('trust proxy', environment.TRUSTED_PROXY);
  }

  const repositories = await createRepositories({
    logger,
    ...environment,
  });

  const serviceId = AdspId.parse(environment.CLIENT_ID);
  const accessServiceUrl = new URL(environment.KEYCLOAK_ROOT_URL);
  const {
    configurationHandler,
    coreStrategy,
    eventService,
    metricsHandler,
    tenantStrategy,
    tenantHandler,
    traceHandler,
    healthCheck,
  } = await initializePlatform(
    {
      serviceId,
      clientSecret: environment.CLIENT_SECRET,
      accessServiceUrl,
      directoryUrl: new URL(environment.DIRECTORY_URL),
      displayName: 'Comment service',
      description: 'Service that allows users to comment on topics.',
      roles: [
        {
          role: ServiceRoles.Admin,
          description: 'Administrator role that grants permission to administer topics and comments.',
          inTenantAdmin: true,
        },
        {
          role: ServiceRoles.TopicSetter,
          description: 'Topic setter role that grants permissions to managed topics.',
        },
      ],
      events: [
        TopicCreatedEventDefinition,
        TopicUpdatedEventDefinition,
        TopicDeletedEventDefinition,
        CommentCreatedEventDefinition,
        CommentUpdatedEventDefinition,
        CommentDeletedEventDefinition,
      ],
      configuration: {
        description: 'Topic types with configuration of topic administrator, commenter, and reader roles.',
        schema: CommentConfigurationSchema,
      },
      combineConfiguration: (tenant: Record<string, TopicType>, core: Record<string, TopicType>, tenantId) =>
        Object.entries({ ...core, ...tenant }).reduce(
          (entities, [id, type]) => ({ ...entities, [id]: new TopicTypeEntity(tenantId, type) }),
          {} as Record<string, TopicTypeEntity>
        ),
      enableConfigurationInvalidation: true,
      useLongConfigurationCacheTTL: true,
      values: [ServiceMetricsValueDefinition],
    },
    { logger }
  );

  passport.use('core', coreStrategy);
  passport.use('tenant', tenantStrategy);

  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(function (user, done) {
    done(null, user as User);
  });

  app.use(passport.initialize());
  app.use(traceHandler);
  app.use(
    '/comment',
    metricsHandler,
    passport.authenticate(['core', 'tenant'], { session: false }),
    tenantHandler,
    configurationHandler
  );

  applyCommentMiddleware(app, { serviceId, logger, eventService, repository: repositories.topicRepository });

  const swagger = JSON.parse(await promisify(readFile)(`${__dirname}/swagger.json`, 'utf8'));
  app.use('/swagger/docs/v1', (_req, res) => {
    res.json(swagger);
  });

  app.get('/health', async (_req, res) => {
    const platform = await healthCheck();
    res.json({ ...platform, db: await repositories.isConnected() });
  });

  app.get('/', async (req, res) => {
    const rootUrl = new URL(`${req.protocol}://${req.get('host')}`);
    res.json({
      name: 'Comment service',
      description: 'Service that allows users to comment on topics.',
      _links: {
        self: { href: new URL(req.originalUrl, rootUrl).href },
        health: { href: new URL('/health', rootUrl).href },
        api: { href: new URL('/comment/v1', rootUrl).href },
        docs: { href: new URL('/swagger/docs/v1', rootUrl).href },
      },
    });
  });

  const errorHandler = createErrorHandler(logger);
  app.use(errorHandler);

  return app;
};

initializeApp().then((app) => {
  const port = environment.PORT || 3346;

  const server = app.listen(port, () => {
    logger.info(`Listening at http://localhost:${port}`);
  });
  server.on('error', (err) => logger.error(`Error encountered in server: ${err}`));
});
