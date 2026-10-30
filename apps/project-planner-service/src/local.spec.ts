import { adspId } from '@abgov/adsp-service-sdk';

const mockApp = { use: jest.fn(), get: jest.fn(), listen: jest.fn() };
const mockExpress = Object.assign(jest.fn(), { json: jest.fn() });
const mockCors = jest.fn();
const mockLoadEnv = jest.fn();
const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };
const mockCreateLogger = jest.fn();
const mockCreateErrorHandler = jest.fn();
const mockCreateLlmFromEnv = jest.fn();
const mockRegisteredServices = jest.fn();
const mockCreatePlannerRouter = jest.fn();
const mockCreateRepositories = jest.fn();

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
  registeredServices: mockRegisteredServices,
}));
jest.mock('./planner/router', () => ({ createPlannerRouter: mockCreatePlannerRouter }));
jest.mock('./postgres', () => ({ createRepositories: mockCreateRepositories }));

describe('local', () => {
  const originalEnv = process.env;
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/local`;
  const errorHandler = jest.fn();
  const llm = { name: 'llm' };
  const repositories = {
    solutionRepository: { name: 'solutions' },
    patternRepository: { name: 'patterns' },
    specialistChatRepository: { name: 'chats' },
    solutionVersionRepository: { name: 'versions' },
    isConnected: jest.fn(),
  };

  const startLocal = async (env: Record<string, string> = {}) => {
    process.env = { ...env };
    jest.resetModules();
    jest.requireActual('./local');
    await new Promise((resolve) => setImmediate(resolve));
    return mockCreatePlannerRouter.mock.calls[0]?.[0];
  };

  const findUse = (path: string) => mockApp.use.mock.calls.filter(([first]) => first === path);

  beforeEach(() => {
    mockExpress.mockReturnValue(mockApp);
    mockExpress.json.mockReturnValue('json-middleware');
    mockCors.mockReturnValue('cors-middleware');
    mockCreateLogger.mockReturnValue(mockLogger);
    mockCreateErrorHandler.mockReturnValue(errorHandler);
    mockCreateLlmFromEnv.mockReturnValue(llm);
    mockCreatePlannerRouter.mockReturnValue('planner-router');
    mockCreateRepositories.mockResolvedValue(repositories);
    mockRegisteredServices.mockReturnValue([]);
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.resetAllMocks();
  });

  describe('startup', () => {
    it('loads local secrets from the git-ignored service .env file', async () => {
      await startLocal();

      expect(mockLoadEnv).toHaveBeenCalledWith({ path: expect.stringMatching(/project-planner-service[\\/]\.env$/) });
    });

    it('listens on the default port 3381', async () => {
      await startLocal();

      expect(mockApp.listen).toHaveBeenCalledWith(3381, expect.any(Function));
    });

    it('listens on PORT when set', async () => {
      await startLocal({ PORT: '4020' });

      expect(mockApp.listen).toHaveBeenCalledWith(4020, expect.any(Function));
    });

    it('logs the local mode address once listening', async () => {
      await startLocal();

      mockApp.listen.mock.calls[0][1]();

      expect(mockLogger.info).toHaveBeenCalledWith('Project planner local mode on http://localhost:3381');
    });

    it('applies cors and a 1mb JSON body parser', async () => {
      await startLocal();

      expect(mockApp.use.mock.calls.slice(0, 2)).toEqual([['cors-middleware'], ['json-middleware']]);
    });

    it('creates the llm from the process environment', async () => {
      await startLocal({ MAAS_MODEL: 'GOA-Default' });

      expect(mockCreateLlmFromEnv).toHaveBeenCalledWith(process.env, mockLogger);
    });

    it('mounts the planner router under /planner/v1', async () => {
      await startLocal();

      expect(findUse('/planner/v1').map(([, handler]) => handler)).toContain('planner-router');
    });

    it('mounts the error handler on /planner/v1 after the router', async () => {
      await startLocal();

      expect(findUse('/planner/v1')[2]).toEqual(['/planner/v1', errorHandler]);
    });

    it('creates the planner router with the llm', async () => {
      const options = await startLocal();

      expect(options.llm).toBe(llm);
    });

    it('creates the planner router with the postgres repositories', async () => {
      const options = await startLocal();

      expect(options).toMatchObject({
        solutionRepository: repositories.solutionRepository,
        patternRepository: repositories.patternRepository,
        specialistChatRepository: repositories.specialistChatRepository,
        solutionVersionRepository: repositories.solutionVersionRepository,
      });
    });

    it('connects to the local postgres defaults when no DB settings are set', async () => {
      await startLocal();

      expect(mockCreateRepositories).toHaveBeenCalledWith({
        logger: mockLogger,
        DB_HOST: 'localhost',
        DB_PORT: 5432,
        DB_NAME: 'postgres',
        DB_USER: 'postgres',
        DB_PASSWORD: 'guest',
        DB_TLS: false,
        migrationsDirectory: expect.stringMatching(/project-planner-service[\\/]migrations$/),
      });
    });

    it('connects with the DB settings from the environment', async () => {
      await startLocal({
        DB_HOST: 'db.local',
        DB_PORT: '5433',
        DB_NAME: 'planner',
        DB_USER: 'planner-user',
        DB_PASSWORD: 'planner-password',
        DB_TLS: 'true',
      });

      expect(mockCreateRepositories).toHaveBeenCalledWith({
        logger: mockLogger,
        DB_HOST: 'db.local',
        DB_PORT: 5433,
        DB_NAME: 'planner',
        DB_USER: 'planner-user',
        DB_PASSWORD: 'planner-password',
        DB_TLS: true,
        migrationsDirectory: expect.any(String),
      });
    });

    it('logs and exits with code 1 when the database is unreachable', async () => {
      const exit = jest.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
      mockCreateRepositories.mockRejectedValue(new Error('connection refused'));

      await startLocal();

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to start local planner: Error: connection refused');
      expect(exit).toHaveBeenCalledWith(1);
      expect(mockApp.listen).not.toHaveBeenCalled();
      exit.mockRestore();
    });

    it('serves a local health endpoint', async () => {
      await startLocal();
      const res = { json: jest.fn() };

      mockApp.get.mock.calls.find(([path]) => path === '/health')[1]({}, res);

      expect(res.json).toHaveBeenCalledWith({ status: 'ok', mode: 'local' });
    });
  });

  describe('dev user middleware', () => {
    const runMiddleware = async () => {
      await startLocal();
      const handler = findUse('/planner/v1').find(([, h]) => typeof h === 'function' && h.length === 3)[1];
      const req: Record<string, unknown> = {};
      const next = jest.fn();
      handler(req, {}, next);
      return { req, next };
    };

    it('attaches a local dev user with planner roles', async () => {
      const { req } = await runMiddleware();

      expect(req.user).toMatchObject({ id: 'local-dev-user', roles: ['planner-user', 'planner-admin'] });
    });

    it('attaches the local dev user to the local tenant', async () => {
      const { req } = await runMiddleware();

      expect((req.user as { tenantId: unknown }).tenantId.toString()).toBe(tenantId.toString());
    });

    it('attaches the local tenant', async () => {
      const { req } = await runMiddleware();

      expect(req.tenant).toMatchObject({ name: 'local', realm: 'local' });
    });

    it('provides an empty configuration', async () => {
      const { req } = await runMiddleware();

      const result = await (req.getConfiguration as () => Promise<unknown>)();

      expect(result).toEqual([{}, {}]);
    });

    it('continues to the next handler', async () => {
      const { next } = await runMiddleware();

      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('ADSP component map drift', () => {
    it('checks the services registered in the monorepo apps', async () => {
      await startLocal();

      expect(mockRegisteredServices).toHaveBeenCalledWith(expect.stringMatching(/[\\/]apps$/));
    });

    it('warns about registered services missing from the component map', async () => {
      mockRegisteredServices.mockReturnValue(['form-service', 'sharepoint-service']);

      await startLocal();

      expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('ADSP component map is out of date: sharepoint-service.'));
    });

    it('does not warn when every registered service is mapped', async () => {
      mockRegisteredServices.mockReturnValue(['form-service']);

      await startLocal();

      expect(mockLogger.warn).not.toHaveBeenCalled();
    });
  });

  describe('event service', () => {
    it('logs events at debug level with ids rendered as strings', async () => {
      const { eventService } = await startLocal();

      eventService.send({ name: 'solution-created', tenantId });

      expect(mockLogger.debug).toHaveBeenCalledWith(expect.stringContaining(`"tenantId":"${tenantId.toString()}"`));
    });
  });
});
