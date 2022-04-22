import * as express from 'express';
import * as fs from 'fs';
import * as passport from 'passport';
import * as compression from 'compression';
import * as cors from 'cors';
import * as helmet from 'helmet';
import { AdspId, initializePlatform } from '@abgov/adsp-service-sdk';
import type { User } from '@abgov/adsp-service-sdk';
import { createLogger, createErrorHandler, createAmqpConfigUpdateService } from '@core-services/core-common';
import { environment } from './environments/environment';
import {
  applyPdfMiddleware,
  configurationSchema,
  GeneratedPdfType,
  PdfGeneratedDefinition,
  PdfGenerationFailedDefinition,
  PdfGenerationQueuedDefinition,
  PdfGenerationUpdatesStream,
  PdfTemplate,
  PdfTemplateEntity,
  ServiceRoles,
} from './pdf';
import { createTemplateService } from './handlebars';
import { createPdfService } from './puppeteer';
import { createFileService } from './file';
import { createPdfQueueService } from './amqp';
import { createJobRepository } from './redis';

const logger = createLogger('pdf-service', environment.LOG_LEVEL);

const initializeApp = async (): Promise<express.Application> => {
  const app = express();

  app.use(compression());
  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));
  app.use(cors());

  if (environment.TRUSTED_PROXY) {
    app.set('trust proxy', environment.TRUSTED_PROXY);
  }

  const templateService = createTemplateService();
  const pdfService = createPdfService();

  const serviceId = AdspId.parse(environment.CLIENT_ID);
  const accessServiceUrl = new URL(environment.KEYCLOAK_ROOT_URL);
  const {
    clearCached,
    configurationHandler,
    configurationService,
    directory,
    eventService,
    healthCheck,
    tenantHandler,
    tenantStrategy,
    tokenProvider,
  } = await initializePlatform(
    {
      serviceId,
      displayName: 'PDF service',
      description: 'Provides utility PDF capabilities.',
      configurationSchema,
      configurationConverter: (config: Record<string, Omit<PdfTemplate, 'tenantId'>>, tenantId) =>
        Object.entries(config).reduce(
          (templates, [templateId, template]) => ({
            ...templates,
            [templateId]: new PdfTemplateEntity(templateService, pdfService, { ...template, tenantId }),
          }),
          {}
        ),
      roles: [ServiceRoles.PdfGenerator],
      events: [PdfGenerationQueuedDefinition, PdfGeneratedDefinition, PdfGenerationFailedDefinition],
      eventStreams: [PdfGenerationUpdatesStream],
      fileTypes: [GeneratedPdfType],
      clientSecret: environment.CLIENT_SECRET,
      accessServiceUrl,
      directoryUrl: new URL(environment.DIRECTORY_URL),
    },
    { logger }
  );

  passport.use('tenant', tenantStrategy);

  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(function (user, done) {
    done(null, user as User);
  });

  const configurationSync = await createAmqpConfigUpdateService({
    ...environment,
    logger,
  });

  configurationSync.getItems().subscribe(({ item, done }) => {
    clearCached(item.tenantId, item.serviceId);
    done();
  });

  app.use(passport.initialize());
  app.use('/pdf', passport.authenticate(['tenant'], { session: false }), tenantHandler, configurationHandler);

  const { repository, ...repositories } = createJobRepository(environment);
  const queueService = await createPdfQueueService({ logger, ...environment });
  applyPdfMiddleware(app, {
    logger,
    serviceId,
    tokenProvider,
    configurationService,
    repository,
    queueService,
    fileService: createFileService({ logger, tokenProvider, directory }),
    eventService,
  });

  let swagger = null;
  app.use('/swagger/docs/v1', (_req, res) => {
    if (swagger) {
      res.json(swagger);
    } else {
      fs.readFile(`${__dirname}/swagger.json`, 'utf8', (err, data) => {
        if (err) {
          res.sendStatus(404);
        } else {
          swagger = JSON.parse(data);
          res.json(swagger);
        }
      });
    }
  });

  app.get('/health', async (_req, res) => {
    const platform = await healthCheck();
    res.json({ ...platform, db: repositories.isConnected(), msg: queueService.isConnected() });
  });

  app.get('/', async (req, res) => {
    const rootUrl = new URL(`${req.protocol}://${req.get('host')}`);
    res.json({
      name: 'PDF service',
      description: 'Provides utility PDF capabilities.',
      _links: {
        self: { href: new URL(req.originalUrl, rootUrl).href },
        health: { href: new URL('/health', rootUrl).href },
        api: { href: new URL('/pdf/v1', rootUrl).href },
        docs: { href: new URL('/swagger/docs/v1', rootUrl).href },
      },
    });
  });

  const errorHandler = createErrorHandler(logger);
  app.use(errorHandler);

  return app;
};

initializeApp().then((app) => {
  const port = environment.PORT || 3345;

  const server = app.listen(port, () => {
    logger.info(`Listening at http://localhost:${port}`);
  });
  server.on('error', (err) => logger.error(`Error encountered in server: ${err}`));
});
