/**
 * Standalone local runner: real planner router with an in-memory repository and a fake dev user.
 * Needs no Postgres, Keycloak or platform services. Not for deployment.
 */
import * as express from 'express';
import * as cors from 'cors';
import * as path from 'path';
import { config as loadEnv } from 'dotenv';
import { adspId } from '@abgov/adsp-service-sdk';
import type { EventService, User } from '@abgov/adsp-service-sdk';
import { createErrorHandler, createLogger } from '@core-services/core-common';
import { createLlmFromEnv, PlannerServiceRoles } from './planner';
import { createPlannerRouter } from './planner/router';
import { MemoryPatternRepository, MemorySolutionRepository, MemorySpecialistChatRepository } from './memory';

// Local secrets (MAAS_API_KEY) come from a git-ignored .env; real environment variables win.
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
    solutionRepository: new MemorySolutionRepository(),
    patternRepository: new MemoryPatternRepository(),
    specialistChatRepository: new MemorySpecialistChatRepository(),
    eventService,
    llm: createLlmFromEnv(process.env, logger),
  }),
);
app.use('/planner/v1', createErrorHandler(logger));
app.get('/health', (_req, res) => res.json({ status: 'ok', mode: 'local' }));

app.listen(port, () => logger.info(`Project planner local mode on http://localhost:${port}`));
