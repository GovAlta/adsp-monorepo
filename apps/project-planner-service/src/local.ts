/**
 * Standalone local runner: real planner router on a local Postgres with a fake dev user and tenant.
 * Needs no Keycloak or platform services. Point it at a local database only; not for deployment.
 */
import * as express from 'express';
import * as cors from 'cors';
import * as path from 'path';
import { config as loadEnv } from 'dotenv';
import { adspId } from '@abgov/adsp-service-sdk';
import type { EventService, User } from '@abgov/adsp-service-sdk';
import { createErrorHandler, createLogger } from '@core-services/core-common';
import { createLlmFromEnv, driftMessage, PlannerServiceRoles, registeredServices, unmappedServices } from './planner';
import { createPlannerRouter } from './planner/router';
import { createRepositories } from './postgres';

// Local secrets (MAAS_API_KEY, DB_*) come from a git-ignored .env; real environment variables win.
loadEnv({ path: path.resolve(process.cwd(), 'apps/project-planner-service/.env') });

const port = Number(process.env.PORT || 3381);
const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/local`;
const logger = createLogger('project-planner-local', 'debug');

const eventService = {
  send: (event: unknown) =>
    logger.debug(
      `event: ${JSON.stringify(event, (_k, v) => (typeof v === 'object' && v?.constructor?.name === 'AdspId' ? v.toString() : v))}`,
    ),
} as unknown as EventService;

const devUser = {
  id: 'local-dev-user',
  name: 'Local Dev',
  email: 'dev@example.com',
  tenantId,
  roles: [PlannerServiceRoles.User, PlannerServiceRoles.Admin],
  isCore: false,
} as unknown as User;

const startLocal = async () => {
  // No live ADSP catalog locally, so check the component map against the monorepo apps instead.
  const unmapped = unmappedServices(registeredServices(path.resolve(process.cwd(), 'apps')));
  if (unmapped.length > 0) {
    logger.warn(driftMessage(unmapped));
  }

  const repositories = await createRepositories({
    logger,
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: Number(process.env.DB_PORT || 5432),
    DB_NAME: process.env.DB_NAME || 'postgres',
    DB_USER: process.env.DB_USER || 'postgres',
    DB_PASSWORD: process.env.DB_PASSWORD || 'guest',
    DB_TLS: process.env.DB_TLS === 'true',
    migrationsDirectory: path.resolve(process.cwd(), 'apps/project-planner-service/migrations'),
  });

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use('/planner/v1', (req, _res, next) => {
    req.user = devUser;
    req.tenant = { id: tenantId, name: 'local', realm: 'local' } as never;
    (req as unknown as { getConfiguration: () => Promise<unknown> }).getConfiguration = async () => [{}, {}];
    next();
  });
  app.use(
    '/planner/v1',
    createPlannerRouter({
      logger,
      solutionRepository: repositories.solutionRepository,
      patternRepository: repositories.patternRepository,
      specialistChatRepository: repositories.specialistChatRepository,
      eventService,
      llm: createLlmFromEnv(process.env, logger),
    }),
  );
  app.use('/planner/v1', createErrorHandler(logger));
  app.get('/health', (_req, res) => res.json({ status: 'ok', mode: 'local' }));

  app.listen(port, () => logger.info(`Project planner local mode on http://localhost:${port}`));
};

startLocal().catch((err) => {
  logger.error(`Failed to start local planner: ${err}`);
  process.exit(1);
});
