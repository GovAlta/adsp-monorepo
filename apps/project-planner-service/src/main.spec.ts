const mockApp = { use: jest.fn(), set: jest.fn(), get: jest.fn(), listen: jest.fn() };
const mockExpress = Object.assign(jest.fn(), { json: jest.fn() });
const mockReadFile = jest.fn();
const mockInitializePlatform = jest.fn();
const mockLogger = { info: jest.fn(), error: jest.fn(), debug: jest.fn() };
const mockApplyPlannerMiddleware = jest.fn();
const mockCreateRepositories = jest.fn();
const mockCreateShutdownHandler = jest.fn();
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
  createShutdownHandler: mockCreateShutdownHandler,
}));
jest.mock('./environments/environment', () => ({ environment: mockEnvironment }));
jest.mock('./planner', () => ({
  applyPlannerMiddleware: mockApplyPlannerMiddleware,
  createLlmFromEnv: jest.fn(),
  PlannerAuditActions: ['planner-audit-actions'],
  PlannerServiceRoles: {},
}));
jest.mock('./postgres', () => ({ createRepositories: mockCreateRepositories }));

describe('main', () => {
  const healthCheck = jest.fn();
  const configurationService = { getConfiguration: jest.fn() };
  const tokenProvider = { getAccessToken: jest.fn() };
  const auditService = { record: jest.fn() };
  const shutdownTelemetry = jest.fn();
  const shutdown = jest.fn();
  const server = { on: jest.fn() };
  let processOnce: jest.SpyInstance;
  const postgresRepositories = {
    solutionRepository: { name: 'solutions' },
    patternRepository: { name: 'patterns' },
    specialistChatRepository: { name: 'chats' },
    isConnected: jest.fn().mockResolvedValue(true),
    close: jest.fn(),
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
    mockApp.listen.mockReturnValue(server);
    mockReadFile.mockImplementation((_path, _encoding, callback) => callback(null, '{}'));
    mockInitializePlatform.mockResolvedValue({
      healthCheck,
      configurationService,
      tokenProvider,
      auditService,
      shutdownTelemetry,
    });
    mockCreateRepositories.mockResolvedValue(postgresRepositories);
    mockCreateShutdownHandler.mockReturnValue(shutdown);
    // Keep test runs from registering real signal listeners.
    processOnce = jest.spyOn(process, 'once').mockImplementation(() => process);
  });

  afterEach(() => {
    processOnce.mockRestore();
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

  it('registers the audit action catalog', async () => {
    await startMain();

    expect(mockInitializePlatform).toHaveBeenCalledWith(
      expect.objectContaining({ auditActions: ['planner-audit-actions'] }),
      expect.anything(),
    );
  });

  it.each([undefined, false, true])('passes PROJECT_PLANNER_AUDIT_ENABLED=%p to the audit client', async (enabled) => {
    mockEnvironment.PROJECT_PLANNER_AUDIT_ENABLED = enabled;
    await startMain();

    expect(mockInitializePlatform.mock.calls[0][0].audit).toEqual({ enabled });
  });

  it('passes the audit service to the planner middleware', async () => {
    await startMain();

    expect(mockApplyPlannerMiddleware).toHaveBeenCalledWith(mockApp, expect.objectContaining({ auditService }));
  });

  it('creates the shutdown handler with the server, audit client, telemetry and database', async () => {
    await startMain();

    expect(mockCreateShutdownHandler).toHaveBeenCalledWith({
      serviceName: 'Project planner service',
      server,
      auditService,
      shutdownTelemetry,
      closeDatabase: postgresRepositories.close,
      logger: mockLogger,
    });
  });

  it.each(['SIGTERM', 'SIGINT'])('shuts down gracefully on %s', async (signal) => {
    await startMain();

    expect(processOnce).toHaveBeenCalledWith(signal, shutdown);
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
