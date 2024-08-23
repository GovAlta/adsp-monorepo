import * as express from 'express';
import { readFile } from 'fs';
import { promisify } from 'util';
import * as passport from 'passport';
import { Strategy as AnonymousStrategy } from 'passport-anonymous';
import * as compression from 'compression';
import * as cors from 'cors';
import * as helmet from 'helmet';
import {
  AdspId,
  ServiceMetricsValueDefinition,
  adspId,
  initializePlatform,
  instrumentAxios,
} from '@abgov/adsp-service-sdk';
import type { User } from '@abgov/adsp-service-sdk';
import { createLogger, createErrorHandler, AjvValidationService } from '@core-services/core-common';
import { environment } from './environments/environment';
import {
  applyFormMiddleware,
  configurationSchema,
  FormCreatedDefinition,
  FormDefinition,
  FormDefinitionEntity,
  FormDeletedDefinition,
  FormServiceRoles,
  FormStatusArchivedDefinition,
  FormStatusLockedDefinition,
  FormStatusNotificationType,
  FormStatusSubmittedDefinition,
  FormStatusUnlockedDefinition,
  FormStatusSetToDraftDefinition,
  SubmissionDispositionedDefinition,
  GeneratedSupportingDocFileType,
  SUBMITTED_FORM,
  SubmittedFormPdfTemplate,
} from './form';
import { createRepositories } from './mongo';
import { createNotificationService } from './notification';
import { createFileService } from './file';
import { createQueueTaskService } from './task';
import { createCommentService } from './comment';
import { isFormDefinition } from './utils';

const logger = createLogger('form-service', environment.LOG_LEVEL);

const initializeApp = async (): Promise<express.Application> => {
  const app = express();

  app.use(compression());
  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));
  app.use(cors());

  if (environment.TRUSTED_PROXY) {
    app.set('trust proxy', environment.TRUSTED_PROXY);
  }

  const SUPPORT_COMMENT_TOPIC_TYPE_ID = 'form-questions';

  instrumentAxios(logger);

  const validationService = new AjvValidationService(logger);

  const serviceId = AdspId.parse(environment.CLIENT_ID);
  const accessServiceUrl = new URL(environment.KEYCLOAK_ROOT_URL);
  const {
    tenantStrategy,
    tenantHandler,
    eventService,
    directory,
    tokenProvider,
    configurationService,
    configurationHandler,
    coreStrategy,
    metricsHandler,
    healthCheck,
    traceHandler,
  } = await initializePlatform(
    {
      serviceId,
      displayName: 'Form service',
      description: 'Service that provides a model for intake forms completed by applicants and processed by assessors.',
      roles: [
        {
          role: FormServiceRoles.Admin,
          description: 'Administrator role for form service.',
        },
        {
          role: FormServiceRoles.IntakeApp,
          description: 'Intake application role for form service.',
        },
        {
          role: FormServiceRoles.Applicant,
          description: 'Applicant role for form service that allows a user to apply from the form app.',
        },
        {
          role: FormServiceRoles.Support,
          description: 'Support role for viewing and responding to form question topics.',
        },
        {
          role: FormServiceRoles.FileReader,
          description: 'File reader role that allows assessors and clerks to review uploaded supporting documents.',
        },
        {
          role: FormServiceRoles.FileUploader,
          description: 'File uploader role that allows applicants to upload supporting documents for the form.',
        },
      ],
      fileTypes: [GeneratedSupportingDocFileType],
      events: [
        FormCreatedDefinition,
        FormDeletedDefinition,
        FormStatusLockedDefinition,
        FormStatusUnlockedDefinition,
        FormStatusSubmittedDefinition,
        FormStatusArchivedDefinition,
        FormStatusSetToDraftDefinition,
        SubmissionDispositionedDefinition,
      ],
      notifications: [FormStatusNotificationType],
      values: [ServiceMetricsValueDefinition],
      serviceConfigurations: [
        {
          serviceId: adspId`urn:ads:platform:comment-service`,
          configuration: {
            [SUPPORT_COMMENT_TOPIC_TYPE_ID]: {
              id: SUPPORT_COMMENT_TOPIC_TYPE_ID,
              name: 'Form questions',
              adminRoles: [`${serviceId}:${FormServiceRoles.Admin}`],
              readerRoles: [],
              commenterRoles: [`${serviceId}:${FormServiceRoles.Support}`],
              securityClassification: 'protected b',
            },
          },
        },
        {
          serviceId: adspId`urn:ads:platform:pdf-service`,
          configuration: {
            [SUBMITTED_FORM]: SubmittedFormPdfTemplate,
          },
        },
      ],
      configuration: {
        description: 'Definitions of forms with configuration of roles allowed to submit and assess.',
        schema: configurationSchema,
        useNamespace: true,
      },
      configurationConverter: (config: Record<string, FormDefinition> | FormDefinition, tenantId) => {
        if (isFormDefinition(config)) {
          return new FormDefinitionEntity(validationService, tenantId, config);
        } else {
          // For backwards compatibility, handle conversion of form definitions configured in a single document.
          return Object.entries(config).reduce(
            (defs, [id, def]) => ({
              ...defs,
              [id]: new FormDefinitionEntity(validationService, tenantId, def),
            }),
            {} as Record<string, FormDefinitionEntity>
          );
        }
      },
      enableConfigurationInvalidation: true,
      useLongConfigurationCacheTTL: true,
      clientSecret: environment.CLIENT_SECRET,
      accessServiceUrl,
      directoryUrl: new URL(environment.DIRECTORY_URL),
    },
    { logger }
  );

  passport.use('core', coreStrategy);
  passport.use('tenant', tenantStrategy);
  passport.use('anonymous', new AnonymousStrategy());

  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(function (user, done) {
    done(null, user as User);
  });

  app.use(passport.initialize());
  app.use(traceHandler);

  app.use(
    '/form',
    metricsHandler,
    passport.authenticate(['core', 'tenant', 'anonymous'], { session: false }),
    tenantHandler,
    configurationHandler
  );

  const notificationService = createNotificationService(logger, directory, tokenProvider);
  const fileService = createFileService(logger, directory, tokenProvider);
  const commentService = await createCommentService({
    logger,
    directory,
    tokenProvider,
    supportTopicTypeId: SUPPORT_COMMENT_TOPIC_TYPE_ID,
  });
  const queueTaskService = createQueueTaskService(serviceId, logger, directory, tokenProvider);
  const repositories = await createRepositories({
    ...environment,
    logger,
    configurationService,
    notificationService,
  });

  applyFormMiddleware(app, {
    ...repositories,
    serviceId,
    logger,
    eventService,
    notificationService,
    fileService,
    commentService,
    queueTaskService,
    directory,
    tokenProvider,
  });

  const swagger = JSON.parse(await promisify(readFile)(`${__dirname}/swagger.json`, 'utf8'));
  app.use('/swagger/docs/v1', (_req, res) => {
    res.json(swagger);
  });

  app.get('/health', async (_req, res) => {
    const platform = await healthCheck();
    const db = repositories.isConnected();
    res.json({ ...platform, db });
  });

  app.get('/', async (req, res) => {
    const rootUrl = new URL(`${req.protocol}://${req.get('host')}`);
    res.json({
      name: 'Form service',
      description: 'Service that provides a model for intake forms completed by applicants and processed by assessors.',
      _links: {
        self: { href: new URL(req.originalUrl, rootUrl).href },
        health: { href: new URL('/health', rootUrl).href },
        api: { href: new URL('/form/v1', rootUrl).href },
        docs: { href: new URL('/swagger/docs/v1', rootUrl).href },
      },
    });
  });

  const errorHandler = createErrorHandler(logger);
  app.use(errorHandler);

  return app;
};

initializeApp().then((app) => {
  const port = environment.PORT || 3343;

  const server = app.listen(port, () => {
    logger.info(`Listening at http://localhost:${port}`);
  });
  server.on('error', (err) => logger.error(`Error encountered in server: ${err}`));
});
