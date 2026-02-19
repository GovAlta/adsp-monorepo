import { AdspId, initializePlatform, User } from '@abgov/adsp-service-sdk';
import {
  createLogger,
  createAmqpConfigUpdateService,
  createErrorHandler,
  UnauthorizedError,
} from '@core-services/core-common';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { createServer, Server } from 'http';
import * as passport from 'passport';
import { Strategy as AnonymousStrategy } from 'passport-anonymous';
import { promisify } from 'util';
import { environment } from './environments/environment';
import { CronJobServiceRoles } from './cron-job';
import { readFile } from 'fs';

const logger = createLogger('cron-job-service', environment.LOG_LEVEL || 'info');

const initializeApp = async (): Promise<Server> => {
  const app = express();
  const server = createServer(app);

  app.use(compression());
  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));
  app.use(cors());

  if (environment.TRUSTED_PROXY) {
    app.set('trust proxy', environment.TRUSTED_PROXY);
  }

  const serviceId = AdspId.parse(environment.CLIENT_ID);
  const accessServiceUrl = new URL(environment.KEYCLOAK_ROOT_URL);
  const {
    tenantService,
    tenantStrategy,
    coreStrategy,
    configurationHandler,
    clearCached,
    healthCheck,
    configurationService,
    directory,
    tokenProvider,
    eventService,
    traceHandler,
  } = await initializePlatform(
    {
      serviceId,
      displayName: 'Cron job service',
      description: 'Service for cron job.',
      roles: [
        {
          role: CronJobServiceRoles.CronJobAdmin,
          description: 'Role used to manage the tenant level cron job',
          inTenantAdmin: true,
        },
      ],
      // configuration: {
      //   description: 'Streams available by websocket with configuration of the included events.',
      //   schema: configurationSchema,
      // },
      // combineConfiguration: (tenant: PushServiceConfiguration, core: PushServiceConfiguration, tenantId) =>
      //   Object.entries({ ...tenant, ...core }).reduce((c, [k, s]) => {
      //     return k === 'webhooks'
      //       ? {
      //           ...c,
      //           webhooks: Object.entries(s as Record<string, Webhook>)
      //             .filter(([_hk, hv]) => hv)
      //             .reduce(
      //               (hs, [hk, hv]) => ({
      //                 ...hs,
      //                 [hk]: isAppStatusWebhook(hv)
      //                   ? new AppStatusWebhookEntity(logger, hv)
      //                   : new WebhookEntity(logger, hv),
      //               }),
      //               {} as Record<string, WebhookEntity>,
      //             ),
      //         }
      //       : { ...c, [k]: new StreamEntity(logger, tenantId, s as Stream) };
      //   }, {}),
      // events: [WebhookTriggeredDefinition],
      clientSecret: environment.CLIENT_SECRET,
      accessServiceUrl,
      directoryUrl: new URL(environment.DIRECTORY_URL),
      // additionalExtractors: [fromSocketHandshake],
    },
    { logger },
  );

  passport.use('jwt', tenantStrategy);
  passport.use('core', coreStrategy);
  passport.use(new AnonymousStrategy());
  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(function (user, done) {
    done(null, user as User);
  });

  app.use(passport.initialize());
  app.use(traceHandler);

  app.use('/cron-job', passport.authenticate(['core', 'jwt', 'anonymous'], { session: false }), configurationHandler);

  // const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = environment;
  // const credentials = REDIS_PASSWORD ? `:${REDIS_PASSWORD}@` : '';
  // const redisClient = createRedisClient(`redis://${credentials}${REDIS_HOST}:${REDIS_PORT}/0`);

  // const ioServer = new IoServer(server, {
  //   serveClient: false,
  //   cors: {
  //     credentials: true,
  //     origin: true,
  //   },
  // });
  // ioServer.adapter(createIoAdapter(redisClient, redisClient.duplicate()));

  // const wrapForIo = (handler: express.RequestHandler) => (socket: Socket, next) => {
  //   const request = socket.request as express.Request;
  //   request[REQ_SOCKET_PROP] = socket;

  //   handler(
  //     request,
  //     {
  //       // Passport JS calls end w/ 401 when all authenticators fail.
  //       end: () => next(new UnauthorizedError('User not authorized to connect.')),
  //     } as unknown as express.Response,
  //     next,
  //   );
  // };

  // // Connections on default namespace for cross-tenant.
  // const defaultIo = ioServer.of('/');
  // defaultIo.use(wrapForIo(passport.initialize()));
  // defaultIo.use(wrapForIo(passport.authenticate(['core', 'jwt'], { session: false })));
  // defaultIo.use(wrapForIo(configurationHandler));

  // // Connections on namespace correspond to tenants.
  // const io = ioServer.of(/^\/[a-zA-Z0-9- ]+$/);
  // io.use(wrapForIo(passport.initialize()));
  // io.use(wrapForIo(passport.authenticate(['core', 'jwt', 'anonymous'], { session: false })));
  // io.use(wrapForIo(configurationHandler));

  // const eventServiceAmp = await createAmqpEventService({ ...environment, logger });

  // const eventServiceAmpWebhooks = await createAmqpEventServiceWebhooks({
  //   ...environment,
  //   queue: 'webhooks',
  //   logger,
  // });

  // applyPushMiddleware(app, [defaultIo, io], {
  //   logger,
  //   eventServiceAmp,
  //   eventServiceAmpWebhooks,
  //   tenantService,
  //   configurationService,
  //   directory,
  //   tokenProvider,
  //   eventService,
  //   serviceId,
  // });

  // const swagger = JSON.parse(await promisify(readFile)(`${__dirname}/swagger.json`, 'utf8'));
  // app.use('/swagger/docs/v1', (_req, res) => {
  //   res.json(swagger);
  // });

  app.get('/health', async (_req, res) => {
    const platform = await healthCheck();
    res.json({
      ...platform,
    });
  });

  app.get('/', async (req, res) => {
    const rootUrl = new URL(`${req.protocol}://${req.get('host')}`);
    res.json({
      name: 'Cron job service',
      description: 'Service for cron job',
    });
  });

  const errorHandler = createErrorHandler(logger);
  app.use(errorHandler);

  return server;
};

initializeApp().then((server) => {
  const port = environment.PORT || 3333;
  server.listen(port, () => {
    logger.info(`Listening at http://localhost:${port}`);
  });
  server.on('error', (err) => logger.error(`Error encountered in server: ${err}`));
});

// import express from 'express';
// import { AdspId, initializePlatform, PlatformCapabilities, adspId } from '@abgov/adsp-service-sdk';
// import { environment } from './environments/environment';
// import { createLogger } from '@core-services/core-common';
// import axios from 'axios';
// import { Job, scheduleJob } from 'node-schedule';

// const serviceId = AdspId.parse(environment.CLIENT_ID);

// const ServiceUserRoles = {
//   CronJobAdmin: 'cron-job-admin',
// };
// const logger = createLogger('shared-cron-job-service', environment?.LOG_LEVEL || 'info');

// const accessServiceUrl = new URL(environment.KEYCLOAK_ROOT_URL);
// let platformHelper: PlatformCapabilities = null;
// // (async () => {
// //   platformHelper = await initializePlatform(
// //     {
// //       serviceId,
// //       displayName: 'Shared cron job service',
// //       description: 'Service for running shared cron job',
// //       roles: [
// //         {
// //           role: ServiceUserRoles.CronJobAdmin,
// //           description: 'Administrator role for the status service.',
// //           inTenantAdmin: true,
// //         },
// //       ],
// //       combineConfiguration: (tenant: Record<string, unknown>, _core: Record<string, unknown>) => ({
// //         // leave the core out        ...core,
// //         ...tenant,
// //       }),
// //       events: [],
// //       notifications: [],
// //       clientSecret: environment.CLIENT_SECRET,
// //       accessServiceUrl,
// //       directoryUrl: new URL(environment.DIRECTORY_URL),
// //     },
// //     { logger },
// //   );
// // })();

// async function runFeedbackWeeklySummary(platformHelper: PlatformCapabilities) {
//   const { directory, tokenProvider } = platformHelper;
//   const feedbackServiceId: AdspId = adspId`urn:ads:platform:feedback-service`;

//   logger.debug(`feedback service id ${feedbackServiceId}`);
//   const accessToken = await tokenProvider.getAccessToken();

//   logger.debug(`access token: ${accessToken}`);

//   const tenants = await platformHelper.tenantService.getTenants();

//   const feedbackHost = await directory.getServiceUrl(feedbackServiceId);

//   const lastWeek = new Date();
//   lastWeek.setDate(lastWeek.getDate() - 7);

//   const params = {
//     start: new Date().toISOString(),
//     end: lastWeek.toISOString(),
//   };

//   const lastWeekFeedback = await axios.get(`${feedbackHost}feedback/v1/feedback`, {
//     headers: {
//       Authorization: `Bearer ${accessToken}`,
//     },
//     params,
//   });

//   for (const tenant of tenants) {
//     logger.debug(`Processing tenant: ${tenant.name} (${tenant.id})`);
//     const sites = await platformHelper.configurationService.getConfiguration(
//       feedbackServiceId,
//       accessToken,
//       adspId`${tenant.id}`,
//     );

//     logger.debug(`sites: ${JSON.stringify(sites)}`);

//     logger.debug(`Last feedback for : ${lastWeekFeedback}`);
//   }
// }

// // // put the weekly summary into on minute cron for testing purpose
// // cron.schedule('* * * * *', async () => {
// //   logger.info('Start to run ');
// //   await runFeedbackWeeklySummary(platformHelper);
// // });

// const host = process.env.HOST ?? 'localhost';
// const port = process.env.PORT ? Number(process.env.PORT) : 3000;
// const app = express();

// // app.get('/', (req, res) => {
// //   res.send({ message: 'Hello API' });
// // });

// const JobDefinitions = [
//   {
//     cronJobTime: '* * * * *',
//     name: 'adsp:platform:mock-service:test',
//   },
//   {
//     cronJobTime: '* * * * *',
//     name: 'adsp:platform:mock-service:test-1',
//   },
// ];

// const JobPool = {};

// for (const job of JobDefinitions) {
//   const scheduledJob = scheduleJob(job.name, job.cronJobTime, () => {
//     console.log(`${job.name}`);
//   });

//   JobPool[job.name] = scheduledJob;
// }
// app.use(express.json());

// app.use(express.urlencoded({ extended: true }));

// app.listen(port, host, () => {
//   console.log(`[ ready ] http://${host}:${port}`);
// });

// app.post('/delete', (req, res) => {
//   const { name } = req.body;
//   console.log(name);

//   if (name in JobPool) {
//     console.log(`Cancel the job ${name}`);
//     JobPool[name].cancel();
//   }
//   res.status(201).json({
//     user: { name },
//   });
// });

// app.post('/add', (req, res) => {
//   const { name, cronJobTime } = req.body;
//   console.log(name);
//   const scheduledJob = scheduleJob(name, cronJobTime, () => {
//     console.log(`${name}`);
//   });

//   JobPool[name] = scheduledJob;
//   res.status(201).json({});
// });
