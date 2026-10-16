import { adspId } from '@abgov/adsp-service-sdk';

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
  ...jest.requireActual('@core-services/core-common'),
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
  const errorHandler = jest.fn();
  const llm = { name: 'llm' };

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

    it('creates the planner router with the in-memory repositories', () => {
      const options = startLocal();
      const memory = jest.requireActual('./memory');

      expect(options.solutionRepository).toBeInstanceOf(memory.MemorySolutionRepository);
      expect(options.patternRepository).toBeInstanceOf(memory.MemoryPatternRepository);
      expect(options.specialistChatRepository).toBeInstanceOf(memory.MemorySpecialistChatRepository);
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
});
