/**
 * Standalone local runner: real planner router with an in-memory repository and a fake dev user.
 * Needs no Postgres, Keycloak or platform services. Not for deployment.
 */
import * as express from 'express';
import * as cors from 'cors';
import * as path from 'path';
import { adspId } from '@abgov/adsp-service-sdk';
import type { EventService, User } from '@abgov/adsp-service-sdk';
import { createLogger } from '@core-services/core-common';
import { createLlmFromEnv, PlannerServiceRoles, Solution, SolutionRepository } from './planner';
import { createPlannerRouter } from './planner/router';

const port = Number(process.env.PORT || 3381);
const serviceId = adspId`urn:ads:platform:project-planner-service`;
const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/local`;
const logger = createLogger('project-planner-local', 'debug');

const store = new Map<string, Solution>();
const key = (tenant: string, id: string) => `${tenant}|${id}`;

const repository: SolutionRepository = {
  async find(top, after, criteria) {
    const skip = after ? Number(Buffer.from(after, 'base64').toString()) || 0 : 0;
    const all = [...store.values()]
      .filter(
        (s) =>
          s.tenantId.toString() === criteria.tenantId.toString() &&
          (!criteria.createdById || s.createdById === criteria.createdById) &&
          (!criteria.status || s.status === criteria.status),
      )
      .sort((a, b) => b.updatedOn.getTime() - a.updatedOn.getTime());
    const results = all.slice(skip, skip + top);
    const hasMore = all.length > skip + top;
    return {
      results,
      page: {
        after,
        next: hasMore ? Buffer.from(String(skip + top)).toString('base64') : undefined,
        size: results.length,
      },
    };
  },
  async get(tenant, id) {
    return store.get(key(tenant.toString(), id)) || null;
  },
  async save(solution) {
    store.set(key(solution.tenantId.toString(), solution.id), solution);
    return solution;
  },
  async delete(tenant, id) {
    return store.delete(key(tenant.toString(), id));
  },
};

const eventService = {
  send: (event: unknown) => logger.debug(`event: ${JSON.stringify(event, (_k, v) => (typeof v === 'object' && v?.constructor?.name === 'AdspId' ? v.toString() : v))}`),
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
    apiId: adspId`${serviceId}:v1`,
    logger,
    solutionRepository: repository,
    eventService,
    llm: createLlmFromEnv(process.env, logger),
  }),
);
// Paths resolve from the repo root, where the local runner is started.
const root = process.cwd();
app.use('/ds', express.static(path.resolve(root, 'node_modules/@abgov/web-components')));
app.use('/tokens', express.static(path.resolve(root, 'node_modules/@abgov/design-tokens/dist')));
app.use('/ui', express.static(path.resolve(root, 'apps/project-planner-service/src/local-ui')));
app.get('/health', (_req, res) => res.json({ status: 'ok', mode: 'local' }));
app.get('/', (_req, res) => res.redirect('/ui'));

app.listen(port, () => logger.info(`Project planner local mode on http://localhost:${port}`));
