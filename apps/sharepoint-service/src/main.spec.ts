const mockApp = { use: jest.fn(), get: jest.fn(), set: jest.fn(), listen: jest.fn() };
const mockExpress = Object.assign(jest.fn(), { json: jest.fn() });
const mockInitializePlatform = jest.fn();
const mockConnectMongo = jest.fn();
const mockCreateSharePointRouter = jest.fn();
const mockGraphTokenProvider = jest.fn();
const mockGetToken = jest.fn();
const mockLocalFileSource = jest.fn();
const mockFileServiceSource = jest.fn();
const mockSharePointFileService = jest.fn();
const mockLibraryDriveResolver = jest.fn();
const mockCreateShutdownHandler = jest.fn();
const mockLogger = { info: jest.fn(), error: jest.fn(), debug: jest.fn(), warn: jest.fn() };
const mockEnvironment: Record<string, unknown> = {};
const mockReadFile = jest.fn();

jest.mock('fs/promises', () => ({ readFile: mockReadFile }));
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
jest.mock('@abgov/adsp-service-sdk', () => ({
  AdspId: {
    parse: jest.fn((value: string) => ({
      namespace: value.split(':')[2],
      service: value.split(':')[3],
      toString: () => value,
    })),
  },
  initializePlatform: mockInitializePlatform,
  instrumentAxios: jest.fn(),
  ServiceMetricsValueDefinition: { name: 'service-metrics' },
}));
jest.mock('@core-services/core-common', () => ({
  createLogger: () => mockLogger,
  createErrorHandler: jest.fn(),
  createShutdownHandler: mockCreateShutdownHandler,
}));
jest.mock('./environments/environment', () => ({ environment: mockEnvironment }));
jest.mock('./mongo', () => ({ connectMongo: mockConnectMongo }));
jest.mock('./sharepoint', () => ({
  ...jest.requireActual('./sharepoint/configuration'),
  ...jest.requireActual('./sharepoint/roles'),
  SharePointAuditActions: 'audit-actions',
  SharePointEventDefinitions: 'event-definitions',
  createSharePointRouter: mockCreateSharePointRouter,
  CredentialStore: jest.fn(),
  FileServiceSource: mockFileServiceSource,
  GraphClient: jest.fn(),
  GraphFileClient: jest.fn(),
  LibraryDriveResolver: mockLibraryDriveResolver,
  GraphTokenProvider: mockGraphTokenProvider,
  LocalFileSource: mockLocalFileSource,
  SharePointFileService: mockSharePointFileService,
  SharePointPusher: jest.fn(),
  SharePointSetup: jest.fn(),
  parseEncryptionKeyring: jest.fn(() => ({ current: { version: 1, key: Buffer.alloc(32) } })),
}));

// The first test compiles main and type-checks the modules it imports, which outlasts the default on a cold cache.
jest.setTimeout(20000);

describe('main', () => {
  const healthCheck = jest.fn();
  const clearCached = jest.fn();
  const shutdownTelemetry = jest.fn();
  const auditService = { record: jest.fn(), flush: jest.fn() };
  const server = { on: jest.fn() };
  const shutdown = jest.fn();
  let processOnce: jest.SpyInstance;
  const platform = {
    coreStrategy: 'core-strategy',
    tenantStrategy: 'tenant-strategy',
    tenantHandler: 'tenant-handler',
    configurationHandler: 'configuration-handler',
    configurationService: { clearCached },
    directory: 'directory',
    auditService,
    eventService: 'event-service',
    tokenProvider: 'token-provider',
    healthCheck,
    metricsHandler: 'metrics-handler',
    traceHandler: 'trace-handler',
    shutdownTelemetry,
  };

  const startMain = async () => {
    jest.isolateModules(() => {
      jest.requireActual('./main');
    });
    for (let i = 0; i < 5; i++) {
      await new Promise((resolve) => setImmediate(resolve));
    }
  };

  const healthHandler = () => mockApp.get.mock.calls.find(([path]) => path === '/health')[1];

  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(mockEnvironment, {
      KEYCLOAK_ROOT_URL: 'http://keycloak.example',
      DIRECTORY_URL: 'http://directory.example',
      CLIENT_ID: 'urn:ads:platform:sharepoint-service',
      CLIENT_SECRET: 'secret',
      CREDENTIALS_KEY: 'key',
      CREDENTIALS_KEY_VERSION: 1,
      ENTRA_AUTHORITY_URL: 'http://entra.example',
      GRAPH_URL: 'http://graph.example/v1.0',
      DEV_FILES_DIRECTORY: '',
      FILE_UPLOAD_CONCURRENCY: 3,
      LOG_LEVEL: 'info',
      PORT: 3350,
    });
    mockExpress.mockReturnValue(mockApp);
    mockInitializePlatform.mockResolvedValue(platform);
    mockConnectMongo.mockResolvedValue({ credentialRepository: {}, isConnected: () => true });
    mockCreateSharePointRouter.mockReturnValue('sharepoint-router');
    mockGraphTokenProvider.mockImplementation(() => ({ getToken: mockGetToken, evict: jest.fn() }));
    mockApp.listen.mockReturnValue(server);
    healthCheck.mockResolvedValue({ access: true });
    mockCreateShutdownHandler.mockReturnValue(shutdown);
    // Keep test runs from registering real signal listeners.
    processOnce = jest.spyOn(process, 'once').mockImplementation(() => process);
    mockReadFile.mockResolvedValue('{"openapi":"3.0.0"}');
  });

  afterEach(() => {
    processOnce.mockRestore();
  });

  it('serves the bundled OpenAPI document', async () => {
    await startMain();
    const [, handler] = mockApp.use.mock.calls.find(([path]) => path === '/swagger/docs/v1');
    const res = { json: jest.fn() };

    handler({}, res);

    expect(mockReadFile).toHaveBeenCalledWith(expect.stringMatching(/swagger\.json$/), 'utf8');
    expect(res.json).toHaveBeenCalledWith({ openapi: '3.0.0' });
  });

  it('registers roles and configuration with the platform, with cache invalidation on', async () => {
    await startMain();
    const [options] = mockInitializePlatform.mock.calls[0];
    expect(options.roles.map(({ role }) => role)).toEqual(['sharepoint-admin', 'sharepoint-writer']);
    expect(options.roles[0].inTenantAdmin).toBe(true);
    expect(options.configuration.schema).toBeDefined();
    expect(options.enableConfigurationInvalidation).toBe(true);
  });

  it('mounts the router behind authentication, tenant and configuration handlers', async () => {
    await startMain();
    const mount = mockApp.use.mock.calls.find(([path]) => path === '/sharepoint/v1');
    expect(mount).toEqual(
      expect.arrayContaining(['metrics-handler', 'tenant-handler', 'configuration-handler', 'sharepoint-router']),
    );
  });

  it('lets the router clear the cached configuration of this service for a tenant', async () => {
    await startMain();
    const [{ clearConfiguration }] = mockCreateSharePointRouter.mock.calls[0];

    clearConfiguration('tenant-1');

    expect(clearCached).toHaveBeenCalledWith('tenant-1', 'platform', 'sharepoint-service');
  });

  it('reports health from the platform and the database without calling Microsoft Graph', async () => {
    await startMain();
    const res = { json: jest.fn() };
    await healthHandler()({}, res);
    expect(res.json).toHaveBeenCalledWith({ access: true, db: true });
    expect(mockGetToken).not.toHaveBeenCalled();
  });

  it('reads files from File Service by default', async () => {
    await startMain();

    expect(mockFileServiceSource).toHaveBeenCalledWith('directory', 'token-provider');
    expect(mockLocalFileSource).not.toHaveBeenCalled();
    expect(mockSharePointFileService.mock.calls[0][4]).toBeInstanceOf(mockLibraryDriveResolver);
    expect(mockSharePointFileService.mock.calls[0][5]).toBe(3);
  });

  it('registers the audit actions and the events admins can be notified of', async () => {
    await startMain();
    const [options] = mockInitializePlatform.mock.calls[0];

    expect(options.auditActions).toBe('audit-actions');
    expect(options.events).toBe('event-definitions');
  });

  it('gives the router the audit and event clients', async () => {
    await startMain();

    expect(mockCreateSharePointRouter.mock.calls[0][0]).toEqual(
      expect.objectContaining({ auditService, eventService: 'event-service' }),
    );
  });

  it('creates the shutdown handler with the server, audit client and telemetry', async () => {
    await startMain();

    expect(mockCreateShutdownHandler).toHaveBeenCalledWith({
      serviceName: 'SharePoint service',
      server,
      auditService,
      shutdownTelemetry,
      logger: mockLogger,
    });
  });

  it.each(['SIGTERM', 'SIGINT'])('shuts down gracefully on %s', async (signal) => {
    await startMain();

    expect(processOnce).toHaveBeenCalledWith(signal, shutdown);
  });

  it('reads files from a local directory when one is configured', async () => {
    mockEnvironment.DEV_FILES_DIRECTORY = 'C:\\test-files';
    await startMain();

    expect(mockLocalFileSource).toHaveBeenCalledWith('C:\\test-files');
    expect(mockFileServiceSource).not.toHaveBeenCalled();
    expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('C:\\test-files'));
  });
});
