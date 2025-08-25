import { AdspId, initializePlatform, instrumentAxios, ServiceMetricsValueDefinition } from '@abgov/adsp-service-sdk';
import type { User } from '@abgov/adsp-service-sdk';
import {
  createLogger,
  createErrorHandler,
  createAmqpConfigUpdateService,
  createAmqpQueueService,
} from '@core-services/core-common';
import * as puppeteer from 'puppeteer';
import { createFileService, createJobRepository, FileResult } from '@core-services/job-common';
import * as express from 'express';
import { readFile } from 'fs';
import { promisify } from 'util';
import * as passport from 'passport';
import * as compression from 'compression';
import * as cors from 'cors';
import * as helmet from 'helmet';
import { environment } from './environments/environment';
import {
  applyPdfMiddleware,
  configurationSchema,
  GeneratedPdfType,
  PdfGeneratedDefinition,
  PdfGenerationFailedDefinition,
  PdfGenerationQueuedDefinition,
  PdfGenerationUpdatesStream,
  PdfServiceWorkItem,
  PdfTemplate,
  PdfTemplateEntity,
  ServiceRoles,
} from './pdf';
import { createTemplateService } from './handlebars';
import { createPdfService } from './puppeteer';

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

  instrumentAxios(logger);

  const serviceId = AdspId.parse(environment.CLIENT_ID);
  const accessServiceUrl = new URL(environment.KEYCLOAK_ROOT_URL);

  const {
    clearCached,
    configurationHandler,
    configurationService,
    coreStrategy,
    directory,
    eventService,
    healthCheck,
    metricsHandler,
    tenantHandler,
    tenantStrategy,
    tokenProvider,
    traceHandler,
  } = await initializePlatform(
    {
      serviceId,
      displayName: 'PDF service',
      description: 'Provides utility PDF capabilities.',
      configuration: {
        description: 'Templates for PDF generation.',
        schema: configurationSchema,
      },
      configurationConverter: (config: Record<string, Omit<PdfTemplate, 'tenantId'>>, tenantId) =>
        Object.entries(config).reduce(
          (templates, [templateId, template]) => ({
            ...templates,
            [templateId]: new PdfTemplateEntity(templateService, pdfService, {
              ...template,
              tenantId,
              logger,
            }),
          }),
          {}
        ),
      roles: [
        {
          role: ServiceRoles.PdfGenerator,
          description: 'Generator role that allows generation of PDFs.',
          inTenantAdmin: true,
        },
      ],
      events: [PdfGenerationQueuedDefinition, PdfGeneratedDefinition, PdfGenerationFailedDefinition],
      eventStreams: [PdfGenerationUpdatesStream],
      fileTypes: [GeneratedPdfType],
      clientSecret: environment.CLIENT_SECRET,
      accessServiceUrl,
      directoryUrl: new URL(environment.DIRECTORY_URL),
      combineConfiguration: (tenantConfig: Record<string, PdfTemplate>, coreConfig: Record<string, PdfTemplate>) => [
        {
          ...tenantConfig,
          ...coreConfig,
        },
      ],
      values: [ServiceMetricsValueDefinition],
      useLongConfigurationCacheTTL: true,
    },
    { logger }
  );

  const templateService = createTemplateService(directory);

  let browse: puppeteer.Browser | null = null;

  async function getBrowser(): Promise<puppeteer.Browser> {
    if (!browse) {
      browse = await puppeteer.launch({
        headless: true,
        args: ['--disable-dev-shm-usage', '--no-sandbox'],
      });
    }
    return browse;
  }

  const browser = await getBrowser();

  const pdfService = await createPdfService(logger, browser);

  passport.use('core', coreStrategy);
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
  app.use(traceHandler);

  app.use(
    '/pdf',
    metricsHandler,
    passport.authenticate(['core', 'tenant'], { session: false }),
    tenantHandler,
    configurationHandler
  );

  const { repository, ...repositories } = createJobRepository<FileResult>({ logger, ...environment });
  const queueService = await createAmqpQueueService<PdfServiceWorkItem>({
    logger,
    queue: 'pdf-service-work',
    ...environment,
  });
  const fileService = createFileService({ logger, tokenProvider, directory });

  applyPdfMiddleware(app, {
    isJobPod: environment.IS_JOB_POD,
    logger,
    serviceId,
    tokenProvider,
    configurationService,
    repository,
    queueService,
    fileService,
    eventService,
    directory,
  });

  const swagger = JSON.parse(await promisify(readFile)(`${__dirname}/swagger.json`, 'utf8'));
  app.use('/swagger/docs/v1', (_req, res) => {
    res.json(swagger);
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
