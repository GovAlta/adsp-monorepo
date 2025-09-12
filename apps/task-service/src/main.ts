import * as express from 'express';
import { readFile } from 'fs';
import { promisify } from 'util';
import * as passport from 'passport';
import * as compression from 'compression';
import * as cors from 'cors';
import * as helmet from 'helmet';
import {
  adspId,
  AdspId,
  initializePlatform,
  instrumentAxios,
  ServiceMetricsValueDefinition,
} from '@abgov/adsp-service-sdk';
import type { User } from '@abgov/adsp-service-sdk';
import { createLogger, createErrorHandler } from '@core-services/core-common';
import { environment } from './environments/environment';
import {
  applyTaskMiddleware,
  configurationSchema,
  QueueEntity,
  TaskServiceConfiguration,
  TaskServiceRoles,
  TaskAssignedDefinition,
  TaskCancelledDefinition,
  TaskCompletedDefinition,
  TaskCreatedDefinition,
  TaskPrioritySetDefinition,
  TaskStartedDefinition,
  TaskUpdatedDefinition,
  TaskDeletedDefinition,
  TaskDataUpdatedDefinition,
} from './task';
import { createRepositories } from './postgres';
import { createCommentService } from './comment';

const logger = createLogger('task-service', environment.LOG_LEVEL);

const initializeApp = async (): Promise<express.Application> => {
  const app = express();

  app.use(compression());
  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));
  app.use(cors());

  if (environment.TRUSTED_PROXY) {
    app.set('trust proxy', environment.TRUSTED_PROXY);
  }

  instrumentAxios(logger);

  const COMMENT_TOPIC_TYPE_ID = 'task-comments';

  instrumentAxios(logger);

  const serviceId = AdspId.parse(environment.CLIENT_ID);
  const accessServiceUrl = new URL(environment.KEYCLOAK_ROOT_URL);
  const {
    coreStrategy,
    configurationHandler,
    directory,
    eventService,
    metricsHandler,
    tenantHandler,
    tenantStrategy,
    tokenProvider,
    healthCheck,
    traceHandler,
  } = await initializePlatform(
    {
      serviceId,
      displayName: 'Task service',
      description: 'Service that provides a model for tasks and work queues.',
      roles: [
        {
          role: TaskServiceRoles.Admin,
          description: 'Administrator role for tasks, definitions, and queues.',
          inTenantAdmin: true,
        },
        {
          role: TaskServiceRoles.TaskReader,
          description: 'Reader role for access tasks.',
        },
        {
          role: TaskServiceRoles.TaskWriter,
          description: 'Writer role for creating and updating tasks.',
        },
      ],
      events: [
        TaskCreatedDefinition,
        TaskUpdatedDefinition,
        TaskPrioritySetDefinition,
        TaskAssignedDefinition,
        TaskStartedDefinition,
        TaskDataUpdatedDefinition,
        TaskCompletedDefinition,
        TaskCancelledDefinition,
        TaskDeletedDefinition,
      ],
      eventStreams: [
        {
          id: 'task-updates',
          name: 'Task Updates',
          description: 'Provides update events for Tasks.',
          publicSubscribe: false,
          subscriberRoles: [`${serviceId}:${TaskServiceRoles.TaskReader}`, `${serviceId}:${TaskServiceRoles.Admin}`],
          events: [
            {
              namespace: serviceId.service,
              name: TaskCreatedDefinition.name,
            },
            {
              namespace: serviceId.service,
              name: TaskUpdatedDefinition.name,
            },
            {
              namespace: serviceId.service,
              name: TaskPrioritySetDefinition.name,
            },
            {
              namespace: serviceId.service,
              name: TaskAssignedDefinition.name,
            },
            {
              namespace: serviceId.service,
              name: TaskStartedDefinition.name,
            },
            {
              namespace: serviceId.service,
              name: TaskUDataUpdatedDefinition.name,
            },
            {
              namespace: serviceId.service,
              name: TaskCompletedDefinition.name,
            },
            {
              namespace: serviceId.service,
              name: TaskCancelledDefinition.name,
            },
            {
              namespace: serviceId.service,
              name: TaskDeletedDefinition.name,
            },
          ],
        },
      ],
      serviceConfigurations: [
        {
          serviceId: adspId`urn:ads:platform:comment-service`,
          configuration: {
            [COMMENT_TOPIC_TYPE_ID]: {
              id: COMMENT_TOPIC_TYPE_ID,
              name: 'Task comments',
              adminRoles: [`${serviceId}:${TaskServiceRoles.Admin}`],
              readerRoles: [],
              commenterRoles: [`${serviceId}:${TaskServiceRoles.TaskReader}`],
              securityClassification: 'protected a',
            },
          },
        },
        {
          serviceId: adspId`urn:ads:platform:directory-service`,
          configuration: {
            [`${serviceId}:v1`]: {
              resourceTypes: [
                {
                  type: 'task',
                  matcher: '^\\/tasks\\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
                  namePath: 'name',
                  deleteEvent: {
                    namespace: serviceId.service,
                    name: TaskDeletedDefinition.name,
                    resourceIdPath: 'task.urn',
                  },
                },
              ],
            },
          },
        },
      ],
      configuration: {
        schema: configurationSchema,
        description: 'Task queues where tasks are created for processing by workers.',
      },
      configurationConverter: ({ queues }: TaskServiceConfiguration) => ({
        queues: Object.entries(queues || {}).reduce((qs, [k, q]) => ({ ...qs, [k]: new QueueEntity(q) }), {}),
      }),
      enableConfigurationInvalidation: true,
      useLongConfigurationCacheTTL: true,
      clientSecret: environment.CLIENT_SECRET,
      accessServiceUrl,
      directoryUrl: new URL(environment.DIRECTORY_URL),
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
    '/task',
    metricsHandler,
    passport.authenticate(['core', 'tenant'], { session: false }),
    tenantHandler,
    configurationHandler
  );

  const repositories = await createRepositories({ logger, ...environment });
  const commentService = await createCommentService({
    logger,
    directory,
    tokenProvider,
    topicTypeId: COMMENT_TOPIC_TYPE_ID,
  });
  applyTaskMiddleware(app, {
    KEYCLOAK_ROOT_URL: environment.KEYCLOAK_ROOT_URL,
    serviceId,
    logger,
    directory,
    tokenProvider,
    taskRepository: repositories.taskRepository,
    eventService,
    commentService,
  });

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
      name: 'Task service',
      description: 'Service that provides a model for tasks and work queues.',
      _links: {
        self: { href: new URL(req.originalUrl, rootUrl).href },
        health: { href: new URL('/health', rootUrl).href },
        api: { href: new URL('/task/v1', rootUrl).href },
        docs: { href: new URL('/swagger/docs/v1', rootUrl).href },
      },
    });
  });

  const errorHandler = createErrorHandler(logger);
  app.use(errorHandler);

  return app;
};

initializeApp().then((app) => {
  const port = environment.PORT || 3341;

  const server = app.listen(port, () => {
    logger.info(`Listening at http://localhost:${port}`);
  });
  server.on('error', (err) => logger.error(`Error encountered in server: ${err}`));
});
