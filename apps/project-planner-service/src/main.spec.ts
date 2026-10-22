const mockApp = { use: jest.fn(), set: jest.fn(), get: jest.fn(), listen: jest.fn() };
const mockExpress = Object.assign(jest.fn(), { json: jest.fn() });
const mockReadFile = jest.fn();
const mockInitializePlatform = jest.fn();
const mockLogger = { info: jest.fn(), error: jest.fn(), debug: jest.fn() };
const mockApplyPlannerMiddleware = jest.fn();
const mockCreateRepositories = jest.fn();
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
  adspId: (strings: TemplateStringsArray) => strings.join(''),
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

describe('main', () => {
  const healthCheck = jest.fn();
  const configurationService = { getConfiguration: jest.fn() };
  const tokenProvider = { getAccessToken: jest.fn() };
  const postgresRepositories = {
    solutionRepository: { name: 'solutions' },
    patternRepository: { name: 'patterns' },
    specialistChatRepository: { name: 'chats' },
    isConnected: jest.fn().mockResolvedValue(true),
  };

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
      DB_HOST: 'db.example',
    });
    mockExpress.mockReturnValue(mockApp);
    mockApp.listen.mockReturnValue({ on: jest.fn() });
    mockReadFile.mockImplementation((_path, _encoding, callback) => callback(null, '{}'));
    mockInitializePlatform.mockResolvedValue({ healthCheck, configurationService, tokenProvider });
    mockCreateRepositories.mockResolvedValue(postgresRepositories);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const readAdspCatalog = (): (() => Promise<string[]>) => mockApplyPlannerMiddleware.mock.calls[0][1].readAdspCatalog;

  it('reads the ADSP catalog keys from the core configuration-service configuration', async () => {
    configurationService.getConfiguration.mockResolvedValue([{}, { 'platform:form-service': {}, 'audit-service': {} }]);
    await startMain();

    expect(await readAdspCatalog()()).toEqual(['platform:form-service', 'audit-service']);
  });

  it('reads the ADSP catalog with the service account token', async () => {
    tokenProvider.getAccessToken.mockResolvedValue('service-token');
    configurationService.getConfiguration.mockResolvedValue([{}, {}]);
    await startMain();

    await readAdspCatalog()();

    expect(configurationService.getConfiguration).toHaveBeenCalledWith('urn:ads:platform:configuration-service', 'service-token');
  });

  it('reads an empty ADSP catalog when there is no core configuration', async () => {
    configurationService.getConfiguration.mockResolvedValue([{}, undefined]);
    await startMain();

    expect(await readAdspCatalog()()).toEqual([]);
  });

  it('connects to postgres with the environment DB settings', async () => {
    await startMain();

    expect(mockCreateRepositories).toHaveBeenCalledWith(expect.objectContaining({ DB_HOST: 'db.example' }));
  });

  it('reads migrations from next to the bundle', async () => {
    await startMain();

    expect(mockCreateRepositories).toHaveBeenCalledWith(
      expect.objectContaining({ migrationsDirectory: expect.stringMatching(/src[\\/]migrations$/) }),
    );
  });

  it('uses the postgres repositories', async () => {
    await startMain();

    expect(mockApplyPlannerMiddleware).toHaveBeenCalledWith(
      mockApp,
      expect.objectContaining({
        solutionRepository: postgresRepositories.solutionRepository,
        patternRepository: postgresRepositories.patternRepository,
        specialistChatRepository: postgresRepositories.specialistChatRepository,
      }),
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
