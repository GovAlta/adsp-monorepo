const mockApp = { use: jest.fn(), set: jest.fn(), get: jest.fn(), listen: jest.fn() };
const mockExpress = Object.assign(jest.fn(), { json: jest.fn() });
const mockReadFile = jest.fn();
const mockInitializePlatform = jest.fn();
const mockLogger = { info: jest.fn(), error: jest.fn(), debug: jest.fn() };
const mockApplyPlannerMiddleware = jest.fn();
const mockCreateRepositories = jest.fn();
const mockCreateMemoryRepositories = jest.fn();
const mockEnvironment: Record<string, unknown> = {};

jest.mock('express', () => mockExpress);
jest.mock('compression', () => jest.fn());
jest.mock('helmet', () => jest.fn());
jest.mock('cors', () => jest.fn());
jest.mock('passport', () => ({
  use: jest.fn(),
  serializeUser: jest.fn(),
  deserializeUser: jest.fn(),
  initialize: jest.fn(),
  authenticate: jest.fn(),
}));
jest.mock('fs', () => ({ ...jest.requireActual('fs'), readFile: mockReadFile }));
jest.mock('@abgov/adsp-service-sdk', () => ({
  AdspId: { parse: jest.fn() },
  initializePlatform: mockInitializePlatform,
  instrumentAxios: jest.fn(),
}));
jest.mock('@core-services/core-common', () => ({
  createLogger: () => mockLogger,
  createErrorHandler: jest.fn(),
}));
jest.mock('./environments/environment', () => ({ environment: mockEnvironment }));
jest.mock('./planner', () => ({
  applyPlannerMiddleware: mockApplyPlannerMiddleware,
  createLlmFromEnv: jest.fn(),
  PlannerServiceRoles: {},
}));
jest.mock('./postgres', () => ({ createRepositories: mockCreateRepositories }));
jest.mock('./memory', () => ({ createMemoryRepositories: mockCreateMemoryRepositories }));

describe('main', () => {
  const healthCheck = jest.fn();
  const createRepositories = (name: string) => ({
    solutionRepository: { name },
    patternRepository: { name },
    specialistChatRepository: { name },
    isConnected: jest.fn().mockResolvedValue(true),
  });
  const postgresRepositories = createRepositories('postgres');
  const memoryRepositories = createRepositories('memory');

  const startMain = async () => {
    jest.resetModules();
    jest.requireActual('./main');
    await new Promise((resolve) => setImmediate(resolve));
  };

  beforeEach(() => {
    Object.keys(mockEnvironment).forEach((key) => delete mockEnvironment[key]);
    Object.assign(mockEnvironment, {
      KEYCLOAK_ROOT_URL: 'http://keycloak.example',
      DIRECTORY_URL: 'http://directory.example',
      PLANNER_STORAGE: 'postgres',
    });
    mockExpress.mockReturnValue(mockApp);
    mockApp.listen.mockReturnValue({ on: jest.fn() });
    mockReadFile.mockImplementation((_path, _encoding, callback) => callback(null, '{}'));
    mockInitializePlatform.mockResolvedValue({ healthCheck });
    mockCreateRepositories.mockResolvedValue(postgresRepositories);
    mockCreateMemoryRepositories.mockReturnValue(memoryRepositories);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    ['memory', memoryRepositories],
    ['postgres', postgresRepositories],
  ])('uses the %s repositories when PLANNER_STORAGE selects them', async (storage, repositories) => {
    mockEnvironment.PLANNER_STORAGE = storage;

    await startMain();

    expect(mockApplyPlannerMiddleware).toHaveBeenCalledWith(
      mockApp,
      expect.objectContaining({ solutionRepository: repositories.solutionRepository }),
    );
  });

  it('reports platform health together with the database connection state', async () => {
    healthCheck.mockResolvedValue({ msg: 'platform-ok' });
    postgresRepositories.isConnected.mockResolvedValue(false);
    await startMain();
    const res = { json: jest.fn() };

    await mockApp.get.mock.calls.find(([path]) => path === '/health')[1]({}, res);

    expect(res.json).toHaveBeenCalledWith({ msg: 'platform-ok', db: false });
  });

  it('logs and exits with code 1 when startup fails', async () => {
    const exit = jest.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
    mockInitializePlatform.mockRejectedValue(new Error('platform down'));

    await startMain();

    expect(mockLogger.error).toHaveBeenCalledWith('Failed to start service: Error: platform down');
    expect(exit).toHaveBeenCalledWith(1);
    expect(mockApp.listen).not.toHaveBeenCalled();
    exit.mockRestore();
  });
});
