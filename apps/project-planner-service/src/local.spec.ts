import { adspId } from '@abgov/adsp-service-sdk';
import type { BusinessPattern, Solution, SpecialistChat } from './planner';

const mockApp = { use: jest.fn(), get: jest.fn(), listen: jest.fn() };
const mockExpress = Object.assign(jest.fn(), { json: jest.fn(), static: jest.fn() });
const mockCors = jest.fn();
const mockLoadEnv = jest.fn();
const mockLogger = { info: jest.fn(), error: jest.fn(), debug: jest.fn() };
const mockCreateLogger = jest.fn();
const mockCreateErrorHandler = jest.fn();
const mockCreateLlmFromEnv = jest.fn();
const mockCreatePlannerRouter = jest.fn();

jest.mock('express', () => mockExpress);
jest.mock('cors', () => mockCors);
jest.mock('dotenv', () => ({ config: mockLoadEnv }));
jest.mock('@core-services/core-common', () => ({
  createLogger: mockCreateLogger,
  createErrorHandler: mockCreateErrorHandler,
}));
jest.mock('./planner', () => ({
  ...jest.requireActual('./planner'),
  createLlmFromEnv: mockCreateLlmFromEnv,
}));
jest.mock('./planner/router', () => ({ createPlannerRouter: mockCreatePlannerRouter }));

describe('local', () => {
  const originalEnv = process.env;
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/local`;
  const otherTenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/alberta-health`;
  const errorHandler = jest.fn();
  const llm = { name: 'llm' };

  const createSolution = (overrides: Partial<Solution> = {}): Solution =>
    ({
      id: 'grant-intake',
      tenantId,
      name: 'Grant intake',
      scenario: 'intake',
      status: 'draft',
      createdById: 'user-1',
      createdByName: 'Pat Planner',
      createdOn: new Date('2026-10-01T00:00:00Z'),
      updatedOn: new Date('2026-10-01T00:00:00Z'),
      revision: 1,
      ...overrides,
    } as Solution);

  const createChat = (overrides: Partial<SpecialistChat> = {}): SpecialistChat => ({
    id: 'chat-1',
    tenantId,
    service: 'form-service',
    solutionId: 'grant-intake',
    title: 'Form questions',
    createdById: 'user-1',
    createdByName: 'Pat Planner',
    createdOn: new Date('2026-10-01T00:00:00Z'),
    updatedOn: new Date('2026-10-01T00:00:00Z'),
    messages: [],
    ...overrides,
  });

  const pattern = { id: 'application-intake', name: 'Application intake' } as BusinessPattern;
  const user = { id: 'user-1', name: 'Pat Planner' };

  const startLocal = (env: Record<string, string> = {}) => {
    process.env = { ...env };
    jest.resetModules();
    jest.requireActual('./local');
    return mockCreatePlannerRouter.mock.calls[0][0];
  };

  const findUse = (path: string) => mockApp.use.mock.calls.filter(([first]) => first === path);

  beforeEach(() => {
    mockExpress.mockReturnValue(mockApp);
    mockExpress.json.mockReturnValue('json-middleware');
    mockExpress.static.mockImplementation((dir: string) => `static:${dir}`);
    mockCors.mockReturnValue('cors-middleware');
    mockCreateLogger.mockReturnValue(mockLogger);
    mockCreateErrorHandler.mockReturnValue(errorHandler);
    mockCreateLlmFromEnv.mockReturnValue(llm);
    mockCreatePlannerRouter.mockReturnValue('planner-router');
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.resetAllMocks();
  });

  describe('startup', () => {
    it('loads local secrets from the git-ignored service .env file', () => {
      startLocal();

      expect(mockLoadEnv).toHaveBeenCalledWith({ path: expect.stringMatching(/project-planner-service[\\/]\.env$/) });
    });

    it('listens on the default port 3381', () => {
      startLocal();

      expect(mockApp.listen).toHaveBeenCalledWith(3381, expect.any(Function));
    });

    it('listens on PORT when set', () => {
      startLocal({ PORT: '4020' });

      expect(mockApp.listen).toHaveBeenCalledWith(4020, expect.any(Function));
    });

    it('logs the local mode address once listening', () => {
      startLocal();

      mockApp.listen.mock.calls[0][1]();

      expect(mockLogger.info).toHaveBeenCalledWith('Project planner local mode on http://localhost:3381');
    });

    it('applies cors and a 1mb JSON body parser', () => {
      startLocal();

      expect(mockApp.use.mock.calls.slice(0, 2)).toEqual([['cors-middleware'], ['json-middleware']]);
    });

    it('creates the llm from the process environment', () => {
      startLocal({ MAAS_MODEL: 'GOA-Default' });

      expect(mockCreateLlmFromEnv).toHaveBeenCalledWith(process.env, mockLogger);
    });

    it('mounts the planner router under /planner/v1', () => {
      startLocal();

      expect(findUse('/planner/v1').map(([, handler]) => handler)).toContain('planner-router');
    });

    it('mounts the error handler on /planner/v1 after the router', () => {
      startLocal();

      expect(findUse('/planner/v1')[2]).toEqual(['/planner/v1', errorHandler]);
    });

    it('creates the planner router with the v1 api id', () => {
      const options = startLocal();

      expect(options.apiId.toString()).toBe('urn:ads:platform:project-planner-service:v1');
    });

    it('creates the planner router with the llm', () => {
      const options = startLocal();

      expect(options.llm).toBe(llm);
    });

    it.each([
      ['/ds', /node_modules[\\/]@abgov[\\/]web-components$/],
      ['/tokens', /node_modules[\\/]@abgov[\\/]design-tokens[\\/]dist$/],
      ['/ui', /apps[\\/]project-planner-service[\\/]src[\\/]local-ui$/],
    ])('serves static assets at %s', (path, directory) => {
      startLocal();

      expect(findUse(path)[0][1]).toMatch(directory);
    });

    it('serves a local health endpoint', () => {
      startLocal();
      const res = { json: jest.fn() };

      mockApp.get.mock.calls.find(([path]) => path === '/health')[1]({}, res);

      expect(res.json).toHaveBeenCalledWith({ status: 'ok', mode: 'local' });
    });

    it('redirects the root to the UI', () => {
      startLocal();
      const res = { redirect: jest.fn() };

      mockApp.get.mock.calls.find(([path]) => path === '/')[1]({}, res);

      expect(res.redirect).toHaveBeenCalledWith('/ui');
    });
  });

  describe('dev user middleware', () => {
    const runMiddleware = () => {
      startLocal();
      const handler = findUse('/planner/v1').find(([, h]) => typeof h === 'function' && h.length === 3)[1];
      const req: Record<string, unknown> = {};
      const next = jest.fn();
      handler(req, {}, next);
      return { req, next };
    };

    it('attaches a local dev user with planner roles', () => {
      const { req } = runMiddleware();

      expect(req.user).toMatchObject({ id: 'local-dev-user', roles: ['planner-user', 'planner-admin'] });
    });

    it('attaches the local dev user to the local tenant', () => {
      const { req } = runMiddleware();

      expect((req.user as { tenantId: unknown }).tenantId.toString()).toBe(tenantId.toString());
    });

    it('attaches the local tenant', () => {
      const { req } = runMiddleware();

      expect(req.tenant).toMatchObject({ name: 'local', realm: 'local' });
    });

    it('provides an empty configuration', async () => {
      const { req } = runMiddleware();

      const result = await (req.getConfiguration as () => Promise<unknown>)();

      expect(result).toEqual([{}, {}]);
    });

    it('continues to the next handler', () => {
      const { next } = runMiddleware();

      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('event service', () => {
    it('logs events at debug level with ids rendered as strings', () => {
      const { eventService } = startLocal();

      eventService.send({ name: 'solution-created', tenantId });

      expect(mockLogger.debug).toHaveBeenCalledWith(expect.stringContaining(`"tenantId":"${tenantId.toString()}"`));
    });
  });

  describe('in-memory solution repository', () => {
    it('returns null for an unknown solution', async () => {
      const { solutionRepository } = startLocal();

      const result = await solutionRepository.get(tenantId, 'missing');

      expect(result).toBeNull();
    });

    it('returns a saved solution by tenant and id', async () => {
      const { solutionRepository } = startLocal();
      const solution = createSolution();
      await solutionRepository.save(solution);

      const result = await solutionRepository.get(tenantId, solution.id);

      expect(result).toBe(solution);
    });

    it('does not return a solution saved for another tenant', async () => {
      const { solutionRepository } = startLocal();
      await solutionRepository.save(createSolution({ tenantId: otherTenantId }));

      const result = await solutionRepository.get(tenantId, 'grant-intake');

      expect(result).toBeNull();
    });

    it('deletes a saved solution', async () => {
      const { solutionRepository } = startLocal();
      await solutionRepository.save(createSolution());

      const result = await solutionRepository.delete(tenantId, 'grant-intake');

      expect(result).toBe(true);
    });

    it('reports false when deleting an unknown solution', async () => {
      const { solutionRepository } = startLocal();

      const result = await solutionRepository.delete(tenantId, 'missing');

      expect(result).toBe(false);
    });

    it('finds solutions for the tenant only, newest first', async () => {
      const { solutionRepository } = startLocal();
      await solutionRepository.save(createSolution({ id: 'older', updatedOn: new Date('2026-10-01T00:00:00Z') }));
      await solutionRepository.save(createSolution({ id: 'newer', updatedOn: new Date('2026-10-05T00:00:00Z') }));
      await solutionRepository.save(createSolution({ id: 'other', tenantId: otherTenantId }));

      const { results } = await solutionRepository.find(10, undefined, { tenantId });

      expect(results.map((s: Solution) => s.id)).toEqual(['newer', 'older']);
    });

    it('filters solutions by creator', async () => {
      const { solutionRepository } = startLocal();
      await solutionRepository.save(createSolution({ id: 'mine', createdById: 'user-1' }));
      await solutionRepository.save(createSolution({ id: 'theirs', createdById: 'user-2' }));

      const { results } = await solutionRepository.find(10, undefined, { tenantId, createdById: 'user-2' });

      expect(results.map((s: Solution) => s.id)).toEqual(['theirs']);
    });

    it('filters solutions by status', async () => {
      const { solutionRepository } = startLocal();
      await solutionRepository.save(createSolution({ id: 'draft-one', status: 'draft' }));
      await solutionRepository.save(createSolution({ id: 'done-one', status: 'completed' }));

      const { results } = await solutionRepository.find(10, undefined, { tenantId, status: 'completed' });

      expect(results.map((s: Solution) => s.id)).toEqual(['done-one']);
    });

    it('returns a next cursor when more solutions remain', async () => {
      const { solutionRepository } = startLocal();
      await solutionRepository.save(createSolution({ id: 'first', updatedOn: new Date('2026-10-02T00:00:00Z') }));
      await solutionRepository.save(createSolution({ id: 'second', updatedOn: new Date('2026-10-01T00:00:00Z') }));

      const { page } = await solutionRepository.find(1, undefined, { tenantId });

      expect(page).toEqual({ after: undefined, next: Buffer.from('1').toString('base64'), size: 1 });
    });

    it('returns the following page when given an after cursor', async () => {
      const { solutionRepository } = startLocal();
      await solutionRepository.save(createSolution({ id: 'first', updatedOn: new Date('2026-10-02T00:00:00Z') }));
      await solutionRepository.save(createSolution({ id: 'second', updatedOn: new Date('2026-10-01T00:00:00Z') }));

      const { results, page } = await solutionRepository.find(1, Buffer.from('1').toString('base64'), { tenantId });

      expect(results.map((s: Solution) => s.id)).toEqual(['second']);
      expect(page.next).toBeUndefined();
    });

    it('starts from the beginning when the after cursor is not numeric', async () => {
      const { solutionRepository } = startLocal();
      await solutionRepository.save(createSolution());

      const { results } = await solutionRepository.find(10, Buffer.from('not-a-number').toString('base64'), { tenantId });

      expect(results).toHaveLength(1);
    });
  });

  describe('in-memory pattern repository', () => {
    it('finds saved patterns for the tenant', async () => {
      const { patternRepository } = startLocal();
      await patternRepository.save(tenantId, pattern, user);

      const result = await patternRepository.find(tenantId);

      expect(result).toEqual([pattern]);
    });

    it('does not find patterns saved for another tenant', async () => {
      const { patternRepository } = startLocal();
      await patternRepository.save(otherTenantId, pattern, user);

      const result = await patternRepository.find(tenantId);

      expect(result).toEqual([]);
    });

    it('returns the saved pattern from save', async () => {
      const { patternRepository } = startLocal();

      const result = await patternRepository.save(tenantId, pattern, user);

      expect(result).toBe(pattern);
    });

    it('deletes a saved pattern', async () => {
      const { patternRepository } = startLocal();
      await patternRepository.save(tenantId, pattern, user);

      const result = await patternRepository.delete(tenantId, pattern.id);

      expect(result).toBe(true);
    });

    it('reports false when deleting an unknown pattern', async () => {
      const { patternRepository } = startLocal();

      const result = await patternRepository.delete(tenantId, 'missing');

      expect(result).toBe(false);
    });
  });

  describe('in-memory specialist chat repository', () => {
    it('returns null for an unknown chat', async () => {
      const { specialistChatRepository } = startLocal();

      const result = await specialistChatRepository.get(tenantId, 'missing');

      expect(result).toBeNull();
    });

    it('returns a saved chat by tenant and id', async () => {
      const { specialistChatRepository } = startLocal();
      const chat = createChat();
      await specialistChatRepository.save(chat);

      const result = await specialistChatRepository.get(tenantId, chat.id);

      expect(result).toBe(chat);
    });

    it('deletes a saved chat', async () => {
      const { specialistChatRepository } = startLocal();
      await specialistChatRepository.save(createChat());

      const result = await specialistChatRepository.delete(tenantId, 'chat-1');

      expect(result).toBe(true);
    });

    it('reports false when deleting an unknown chat', async () => {
      const { specialistChatRepository } = startLocal();

      const result = await specialistChatRepository.delete(tenantId, 'missing');

      expect(result).toBe(false);
    });

    it('finds only the requesting user chats for the tenant, newest first', async () => {
      const { specialistChatRepository } = startLocal();
      await specialistChatRepository.save(createChat({ id: 'older', updatedOn: new Date('2026-10-01T00:00:00Z') }));
      await specialistChatRepository.save(createChat({ id: 'newer', updatedOn: new Date('2026-10-05T00:00:00Z') }));
      await specialistChatRepository.save(createChat({ id: 'other-user', createdById: 'user-2' }));
      await specialistChatRepository.save(createChat({ id: 'other-tenant', tenantId: otherTenantId }));

      const result = await specialistChatRepository.find({ tenantId, createdById: 'user-1' });

      expect(result.map((c: SpecialistChat) => c.id)).toEqual(['newer', 'older']);
    });

    it('filters chats by service', async () => {
      const { specialistChatRepository } = startLocal();
      await specialistChatRepository.save(createChat({ id: 'form-chat', service: 'form-service' }));
      await specialistChatRepository.save(createChat({ id: 'file-chat', service: 'file-service' }));

      const result = await specialistChatRepository.find({ tenantId, createdById: 'user-1', service: 'file-service' });

      expect(result.map((c: SpecialistChat) => c.id)).toEqual(['file-chat']);
    });

    it('filters chats by solution', async () => {
      const { specialistChatRepository } = startLocal();
      await specialistChatRepository.save(createChat({ id: 'grant-chat', solutionId: 'grant-intake' }));
      await specialistChatRepository.save(createChat({ id: 'permit-chat', solutionId: 'permit-renewal' }));

      const result = await specialistChatRepository.find({
        tenantId,
        createdById: 'user-1',
        solutionId: 'permit-renewal',
      });

      expect(result.map((c: SpecialistChat) => c.id)).toEqual(['permit-chat']);
    });
  });
});
