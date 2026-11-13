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
const mockLogger = { info: jest.fn(), error: jest.fn(), debug: jest.fn(), warn: jest.fn() };
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
jest.mock('@abgov/adsp-service-sdk', () => ({
  AdspId: { parse: jest.fn((value: string) => value) },
  initializePlatform: mockInitializePlatform,
  instrumentAxios: jest.fn(),
  ServiceMetricsValueDefinition: { name: 'service-metrics' },
}));
jest.mock('@core-services/core-common', () => ({
  createLogger: () => mockLogger,
  createErrorHandler: jest.fn(),
}));
jest.mock('./environments/environment', () => ({ environment: mockEnvironment }));
jest.mock('./mongo', () => ({ connectMongo: mockConnectMongo }));
jest.mock('./sharepoint', () => ({
  ...jest.requireActual('./sharepoint/configuration'),
  ...jest.requireActual('./sharepoint/roles'),
  createSharePointRouter: mockCreateSharePointRouter,
  CredentialStore: jest.fn(),
  FileServiceSource: mockFileServiceSource,
  GraphClient: jest.fn(),
  GraphFileClient: jest.fn(),
  GraphTokenProvider: mockGraphTokenProvider,
  LocalFileSource: mockLocalFileSource,
  SharePointFileService: mockSharePointFileService,
  SharePointPusher: jest.fn(),
  parseEncryptionKey: jest.fn(() => ({ version: 1, key: Buffer.alloc(32) })),
}));

describe('main', () => {
  const healthCheck = jest.fn();
  const platform = {
    coreStrategy: 'core-strategy',
    tenantStrategy: 'tenant-strategy',
    tenantHandler: 'tenant-handler',
    configurationHandler: 'configuration-handler',
    directory: 'directory',
    tokenProvider: 'token-provider',
    healthCheck,
    metricsHandler: 'metrics-handler',
    traceHandler: 'trace-handler',
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
    mockApp.listen.mockReturnValue({ on: jest.fn() });
    healthCheck.mockResolvedValue({ access: true });
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
    expect(mockSharePointFileService.mock.calls[0][4]).toBe(3);
  });

  it('reads files from a local directory when one is configured', async () => {
    mockEnvironment.DEV_FILES_DIRECTORY = 'C:\\test-files';
    await startMain();

    expect(mockLocalFileSource).toHaveBeenCalledWith('C:\\test-files');
    expect(mockFileServiceSource).not.toHaveBeenCalled();
    expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('C:\\test-files'));
  });
});
