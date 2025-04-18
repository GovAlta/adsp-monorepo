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
  FormSupportingDocFileType,
  SUBMITTED_FORM,
  SubmittedFormPdfTemplate,
  SubmittedFormPdfUpdatesStream,
  INTAKE_CALENDAR_NAME,
  SUPPORT_COMMENT_TOPIC_TYPE_ID,
  FormExportFileType,
  FormQuestionUpdatesStream,
  SubmissionDeletedDefinition,
} from './form';
import { createRepositories } from './mongo';
import { createNotificationService } from './notification';
import { createFileService } from './file';
import { createQueueTaskService } from './task';
import { createCommentService } from './comment';
import { isFormDefinition } from './utils';
import { createPdfService } from './pdf';
import { createCalendarService } from './calendar';

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

  instrumentAxios(logger);

  const validationService = new AjvValidationService(logger);

  const serviceId = AdspId.parse(environment.CLIENT_ID);
  const accessServiceUrl = new URL(environment.KEYCLOAK_ROOT_URL);
  const {
    tenantStrategy,
    tenantHandler,
    eventService,
    directory,
    tenantService,
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
        {
          role: FormServiceRoles.Tester,
          description: 'Tester role for form service that allows access to forms without open intakes.',
        },
      ],
      fileTypes: [FormSupportingDocFileType, FormExportFileType],
      events: [
        FormCreatedDefinition,
        FormDeletedDefinition,
        FormStatusLockedDefinition,
        FormStatusUnlockedDefinition,
        FormStatusSubmittedDefinition,
        FormStatusArchivedDefinition,
        FormStatusSetToDraftDefinition,
        SubmissionDispositionedDefinition,
        SubmissionDeletedDefinition,
      ],
      eventStreams: [SubmittedFormPdfUpdatesStream, FormQuestionUpdatesStream],
      notifications: [FormStatusNotificationType],
      values: [ServiceMetricsValueDefinition],
      serviceConfigurations: [
        // Register comment service form support comment topic.
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
        // Register PDF service submitted form PDF template.
        {
          serviceId: adspId`urn:ads:platform:pdf-service`,
          configuration: {
            [SUBMITTED_FORM]: SubmittedFormPdfTemplate,
          },
        },
        // Register calendar service scheduled form intake calendar.
        {
          serviceId: adspId`urn:ads:platform:calendar-service`,
          configuration: {
            [INTAKE_CALENDAR_NAME]: {
              name: INTAKE_CALENDAR_NAME,
              displayName: 'Form intake',
              description: 'Calendar of scheduled form intakes.',
              readRoles: [`urn:ads:platform:tenant-service:platform-service`],
              updateRoles: [`${serviceId}:${FormServiceRoles.Admin}`],
            },
          },
        },
        // Register export service form and submission export source.
        {
          serviceId: adspId`urn:ads:platform:export-service`,
          configuration: {
            sources: {
              [`${serviceId}`]: {
                exporterRoles: [`${serviceId}:${FormServiceRoles.Admin}`],
              },
            },
          },
        },
        // Register directory service resource types for forms and submissions.
        {
          serviceId: adspId`urn:ads:platform:directory-service`,
          configuration: {
            [`${serviceId}:v1`]: {
              resourceTypes: [
                {
                  type: 'form',
                  matcher: '^\\/forms\\/[\\w]{8}(-[\\w]{4}){3}-[\\w]{12}$',
                  deleteEvent: {
                    namespace: serviceId.service,
                    name: FormDeletedDefinition.name,
                    resourceIdPath: 'urn',
                  },
                },
                {
                  type: 'submission',
                  matcher: '^\\/submissions\\/[\\w]{8}(-[\\w]{4}){3}-[\\w]{12}$',
                  deleteEvent: {
                    namespace: serviceId.service,
                    name: SubmissionDeletedDefinition.name,
                    resourceIdPath: 'urn',
                  },
                },
              ],
            },
          },
        },
      ],
      configuration: {
        description: 'Definitions of forms with configuration of roles allowed to submit and assess.',
        schema: configurationSchema,
        useNamespace: true,
      },
      configurationConverter: (config: Record<string, FormDefinition> | FormDefinition, tenantId, revision) => {
        if (isFormDefinition(config)) {
          return new FormDefinitionEntity(validationService, calendarService, tenantId, config, revision);
        } else {
          // For backwards compatibility, handle conversion of form definitions configured in a single document.
          return Object.entries(config).reduce(
            (defs, [id, def]) => ({
              ...defs,
              [id]: new FormDefinitionEntity(validationService, calendarService, tenantId, def),
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

  const notificationService = createNotificationService(adspId`${serviceId}:v1`, logger, directory, tokenProvider);
  const fileService = createFileService(logger, directory, tokenProvider);
  const commentService = await createCommentService(logger, directory, tokenProvider, SUPPORT_COMMENT_TOPIC_TYPE_ID);
  const queueTaskService = createQueueTaskService(serviceId, logger, directory, tokenProvider);
  const pdfService = createPdfService(logger, directory, tokenProvider);
  const calendarService = await createCalendarService(logger, directory, tokenProvider, INTAKE_CALENDAR_NAME);

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
    directory,
    tokenProvider,
    eventService,
    tenantService,
    notificationService,
    fileService,
    commentService,
    queueTaskService,
    pdfService,
    calendarService,
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
