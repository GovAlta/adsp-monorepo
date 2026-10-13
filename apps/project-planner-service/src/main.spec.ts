const mockApp = { use: jest.fn(), set: jest.fn(), get: jest.fn(), listen: jest.fn() };
const mockExpress = Object.assign(jest.fn(), { json: jest.fn() });
const mockCompression = jest.fn();
const mockHelmet = jest.fn();
const mockCors = jest.fn();
const mockPassport = {
  use: jest.fn(),
  serializeUser: jest.fn(),
  deserializeUser: jest.fn(),
  initialize: jest.fn(),
  authenticate: jest.fn(),
};
const mockReadFile = jest.fn();
const mockInitializePlatform = jest.fn();
const mockInstrumentAxios = jest.fn();
const mockAdspIdParse = jest.fn();
const mockLogger = { info: jest.fn(), error: jest.fn(), debug: jest.fn() };
const mockCreateLogger = jest.fn();
const mockCreateErrorHandler = jest.fn();
const mockApplyPlannerMiddleware = jest.fn();
const mockCreateLlmFromEnv = jest.fn();
const mockCreateRepositories = jest.fn();
const mockEnvironment: Record<string, unknown> = {};

jest.mock('express', () => mockExpress);
jest.mock('compression', () => mockCompression);
jest.mock('helmet', () => mockHelmet);
jest.mock('cors', () => mockCors);
jest.mock('passport', () => mockPassport);
jest.mock('fs', () => ({ ...jest.requireActual('fs'), readFile: mockReadFile }));
jest.mock('@abgov/adsp-service-sdk', () => ({
  AdspId: { parse: mockAdspIdParse },
  initializePlatform: mockInitializePlatform,
  instrumentAxios: mockInstrumentAxios,
  ServiceMetricsValueDefinition: { name: 'service-metrics' },
}));
jest.mock('@core-services/core-common', () => ({
  createLogger: mockCreateLogger,
  createErrorHandler: mockCreateErrorHandler,
}));
jest.mock('./environments/environment', () => ({ environment: mockEnvironment }));
jest.mock('./planner', () => ({
  applyPlannerMiddleware: mockApplyPlannerMiddleware,
  configurationSchema: { type: 'object' },
  createLlmFromEnv: mockCreateLlmFromEnv,
  PlannerServiceRoles: { Admin: 'planner-admin', User: 'planner-user' },
  SolutionCreatedDefinition: { name: 'solution-created' },
  SolutionUpdatedDefinition: { name: 'solution-updated' },
  SolutionDeletedDefinition: { name: 'solution-deleted' },
}));
jest.mock('./postgres', () => ({ createRepositories: mockCreateRepositories }));

describe('main', () => {
  const serviceId = { toString: () => 'urn:ads:platform:project-planner-service' };
  const platform = {
    coreStrategy: { name: 'core-strategy' },
    tenantStrategy: { name: 'tenant-strategy' },
    configurationHandler: jest.fn(),
    eventService: { send: jest.fn() },
    metricsHandler: jest.fn(),
    tenantHandler: jest.fn(),
    healthCheck: jest.fn(),
    traceHandler: jest.fn(),
  };
  const repositories = {
    solutionRepository: { name: 'solutions' },
    patternRepository: { name: 'patterns' },
    specialistChatRepository: { name: 'chats' },
    isConnected: jest.fn(),
  };
  const llm = { name: 'llm' };
  const authenticateHandler = jest.fn();
  const errorHandler = jest.fn();
  const server = { on: jest.fn() };

  const startMain = async () => {
    jest.resetModules();
    jest.requireActual('./main');
    await new Promise((resolve) => setImmediate(resolve));
  };

  const findUse = (path: string) => mockApp.use.mock.calls.find(([first]) => first === path);
  const findGet = (path: string) => mockApp.get.mock.calls.find(([first]) => first === path)[1];

  const createResponse = () => ({ json: jest.fn() });

  beforeEach(() => {
    Object.keys(mockEnvironment).forEach((key) => delete mockEnvironment[key]);
    Object.assign(mockEnvironment, {
      LOG_LEVEL: 'debug',
      TRUSTED_PROXY: 'uniquelocal',
      CLIENT_ID: 'urn:ads:platform:project-planner-service',
      CLIENT_SECRET: 'test-client-secret',
      KEYCLOAK_ROOT_URL: 'http://keycloak.example',
      DIRECTORY_URL: 'http://directory.example',
      OTEL_EXPORTER_OTLP_ENDPOINT: 'http://otel.example',
      PORT: 3381,
      MAAS_API_KEY: 'test-maas-key',
      MAAS_BASE_URL: 'https://maas.example/v1',
      MAAS_MODEL: 'GOA-Default',
      MAAS_TIMEOUT_MS: 120000,
      MAAS_INSECURE_TLS: false,
      DB_HOST: 'localhost',
    });
    mockExpress.mockReturnValue(mockApp);
    mockExpress.json.mockReturnValue('json-middleware');
    mockCompression.mockReturnValue('compression-middleware');
    mockHelmet.mockReturnValue('helmet-middleware');
    mockCors.mockReturnValue('cors-middleware');
    mockPassport.initialize.mockReturnValue('passport-initialize');
    mockPassport.authenticate.mockReturnValue(authenticateHandler);
    mockReadFile.mockImplementation((_path, _encoding, callback) => callback(null, '{"openapi":"3.0.0"}'));
    mockAdspIdParse.mockReturnValue(serviceId);
    mockInitializePlatform.mockResolvedValue(platform);
    mockCreateLogger.mockReturnValue(mockLogger);
    mockCreateErrorHandler.mockReturnValue(errorHandler);
    mockCreateRepositories.mockResolvedValue(repositories);
    mockCreateLlmFromEnv.mockReturnValue(llm);
    mockApp.listen.mockReturnValue(server);
    platform.healthCheck.mockResolvedValue({ db: false, msg: 'platform-ok' });
    repositories.isConnected.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('creates the logger with the configured log level', async () => {
    await startMain();

    expect(mockCreateLogger).toHaveBeenCalledWith('project-planner-service', 'debug');
  });

  it.each([
    ['compression', 'compression-middleware'],
    ['helmet', 'helmet-middleware'],
    ['json body parser', 'json-middleware'],
    ['cors', 'cors-middleware'],
  ])('applies the %s middleware', async (_name, middleware) => {
    await startMain();

    expect(mockApp.use).toHaveBeenCalledWith(middleware);
  });

  it('limits JSON request bodies to 1mb', async () => {
    await startMain();

    expect(mockExpress.json).toHaveBeenCalledWith({ limit: '1mb' });
  });

  it('sets the trust proxy setting when TRUSTED_PROXY is configured', async () => {
    await startMain();

    expect(mockApp.set).toHaveBeenCalledWith('trust proxy', 'uniquelocal');
  });

  it('does not set the trust proxy setting when TRUSTED_PROXY is empty', async () => {
    mockEnvironment.TRUSTED_PROXY = '';

    await startMain();

    expect(mockApp.set).not.toHaveBeenCalled();
  });

  it('instruments axios with the service logger', async () => {
    await startMain();

    expect(mockInstrumentAxios).toHaveBeenCalledWith(mockLogger);
  });

  it('initializes the platform with the service identity and credentials', async () => {
    await startMain();

    expect(mockInitializePlatform).toHaveBeenCalledWith(
      expect.objectContaining({
        serviceId,
        displayName: 'Project planner service',
        clientSecret: 'test-client-secret',
        accessServiceUrl: new URL('http://keycloak.example'),
        directoryUrl: new URL('http://directory.example'),
        tracing: 'http://otel.example',
        metrics: 'http://otel.example',
      }),
      { logger: mockLogger },
    );
  });

  it('registers the solution created, updated and deleted events with the platform', async () => {
    await startMain();

    expect(mockInitializePlatform.mock.calls[0][0].events).toEqual([
      { name: 'solution-created' },
      { name: 'solution-updated' },
      { name: 'solution-deleted' },
    ]);
  });

  it('registers the tenant pattern configuration schema with the platform', async () => {
    await startMain();

    expect(mockInitializePlatform.mock.calls[0][0].configuration).toEqual({
      schema: { type: 'object' },
      description: expect.stringContaining('business patterns'),
    });
  });

  it('registers the admin role as a tenant admin role and the user role', async () => {
    await startMain();

    expect(mockInitializePlatform.mock.calls[0][0].roles).toEqual([
      expect.objectContaining({ role: 'planner-admin', inTenantAdmin: true }),
      expect.objectContaining({ role: 'planner-user' }),
    ]);
  });

  it('registers the service metrics value definition', async () => {
    await startMain();

    expect(mockInitializePlatform.mock.calls[0][0].values).toEqual([{ name: 'service-metrics' }]);
  });

  it('registers the core and tenant passport strategies', async () => {
    await startMain();

    expect(mockPassport.use.mock.calls).toEqual([
      ['core', platform.coreStrategy],
      ['tenant', platform.tenantStrategy],
    ]);
  });

  it('serializes the user as-is for passport sessions', async () => {
    await startMain();
    const done = jest.fn();
    const user = { id: 'user-1' };

    mockPassport.serializeUser.mock.calls[0][0](user, done);

    expect(done).toHaveBeenCalledWith(null, user);
  });

  it('deserializes the user as-is for passport sessions', async () => {
    await startMain();
    const done = jest.fn();
    const user = { id: 'user-1' };

    mockPassport.deserializeUser.mock.calls[0][0](user, done);

    expect(done).toHaveBeenCalledWith(null, user);
  });

  it('initializes passport', async () => {
    await startMain();

    expect(mockApp.use).toHaveBeenCalledWith('passport-initialize');
  });

  it('applies the trace handler', async () => {
    await startMain();

    expect(mockApp.use).toHaveBeenCalledWith(platform.traceHandler);
  });

  it('authenticates planner requests with the core and tenant strategies without sessions', async () => {
    await startMain();

    expect(mockPassport.authenticate).toHaveBeenCalledWith(['core', 'tenant'], { session: false });
  });

  it('mounts metrics, authentication, tenant and configuration handlers on the planner path', async () => {
    await startMain();

    expect(findUse('/planner')).toEqual([
      '/planner',
      platform.metricsHandler,
      authenticateHandler,
      platform.tenantHandler,
      platform.configurationHandler,
    ]);
  });

  it('creates the repositories with the logger and environment', async () => {
    await startMain();

    expect(mockCreateRepositories).toHaveBeenCalledWith(expect.objectContaining({ logger: mockLogger, DB_HOST: 'localhost' }));
  });

  it('mounts the planner router with repositories, event service and llm', async () => {
    await startMain();

    expect(mockApplyPlannerMiddleware).toHaveBeenCalledWith(mockApp, {
      serviceId,
      logger: mockLogger,
      solutionRepository: repositories.solutionRepository,
      patternRepository: repositories.patternRepository,
      specialistChatRepository: repositories.specialistChatRepository,
      eventService: platform.eventService,
      llm,
    });
  });

  it('creates the llm from MAAS settings converted to strings', async () => {
    await startMain();

    expect(mockCreateLlmFromEnv).toHaveBeenCalledWith(
      {
        MAAS_API_KEY: 'test-maas-key',
        MAAS_BASE_URL: 'https://maas.example/v1',
        MAAS_MODEL: 'GOA-Default',
        MAAS_TIMEOUT_MS: '120000',
        MAAS_INSECURE_TLS: 'false',
      },
      mockLogger,
    );
  });

  it('reads the swagger document that sits beside the compiled bundle', async () => {
    await startMain();

    expect(mockReadFile).toHaveBeenCalledWith(expect.stringMatching(/swagger\.json$/), 'utf8', expect.any(Function));
  });

  it('serves the swagger document at the docs path', async () => {
    await startMain();
    const res = createResponse();

    findUse('/swagger/docs/v1')[1]({}, res);

    expect(res.json).toHaveBeenCalledWith({ openapi: '3.0.0' });
  });

  it('reports platform health together with the database connection state', async () => {
    await startMain();
    const res = createResponse();

    await findGet('/health')({}, res);

    expect(res.json).toHaveBeenCalledWith({ db: true, msg: 'platform-ok' });
  });

  it('reports the database as disconnected when the repository is not connected', async () => {
    repositories.isConnected.mockResolvedValue(false);
    await startMain();
    const res = createResponse();

    await findGet('/health')({}, res);

    expect(res.json).toHaveBeenCalledWith({ db: false, msg: 'platform-ok' });
  });

  it('serves service metadata with hypermedia links at the root', async () => {
    await startMain();
    const req = { protocol: 'https', get: jest.fn().mockReturnValue('planner.example'), originalUrl: '/' };
    const res = createResponse();

    await findGet('/')(req, res);

    expect(res.json).toHaveBeenCalledWith({
      name: 'Project planner service',
      description: expect.any(String),
      _links: {
        self: { href: 'https://planner.example/' },
        health: { href: 'https://planner.example/health' },
        api: { href: 'https://planner.example/planner/v1' },
        docs: { href: 'https://planner.example/swagger/docs/v1' },
      },
    });
  });

  it('registers the error handler last', async () => {
    await startMain();

    expect(mockApp.use.mock.calls[mockApp.use.mock.calls.length - 1]).toEqual([errorHandler]);
  });

  it('listens on the configured port', async () => {
    mockEnvironment.PORT = 4010;

    await startMain();

    expect(mockApp.listen).toHaveBeenCalledWith(4010, expect.any(Function));
  });

  it('falls back to port 3381 when PORT is not set', async () => {
    mockEnvironment.PORT = 0;

    await startMain();

    expect(mockApp.listen).toHaveBeenCalledWith(3381, expect.any(Function));
  });

  it('logs the listening address once the server has started', async () => {
    await startMain();

    mockApp.listen.mock.calls[0][1]();

    expect(mockLogger.info).toHaveBeenCalledWith('Listening at http://localhost:3381');
  });

  it('registers an error listener on the server', async () => {
    await startMain();

    expect(server.on).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('logs server errors', async () => {
    await startMain();
    const handler = server.on.mock.calls[0][1];

    handler(new Error('EADDRINUSE'));

    expect(mockLogger.error).toHaveBeenCalledWith('Error encountered in server: Error: EADDRINUSE');
  });
});
