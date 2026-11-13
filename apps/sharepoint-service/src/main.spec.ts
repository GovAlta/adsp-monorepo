const mockApp = { use: jest.fn(), get: jest.fn(), listen: jest.fn() };
const mockExpress = Object.assign(jest.fn(), { json: jest.fn() });
const mockInitializePlatform = jest.fn();
const mockLogger = { info: jest.fn(), error: jest.fn(), debug: jest.fn() };
const mockCreateSharePointRouter = jest.fn();
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
  AdspId: { parse: jest.fn() },
  initializePlatform: mockInitializePlatform,
}));
jest.mock('@core-services/core-common', () => ({
  createLogger: () => mockLogger,
  createErrorHandler: jest.fn(),
}));
jest.mock('./environments/environment', () => ({ environment: mockEnvironment }));
jest.mock('./sharepoint', () => ({
  createSharePointRouter: mockCreateSharePointRouter,
  SharePointServiceRoles: { Admin: 'sharepoint-admin', Writer: 'sharepoint-writer' },
}));

describe('main', () => {
  const healthCheck = jest.fn();
  const platform = {
    coreStrategy: 'core-strategy',
    tenantStrategy: 'tenant-strategy',
    tenantHandler: 'tenant-handler',
    healthCheck,
    traceHandler: 'trace-handler',
  };

  const startMain = async () => {
    jest.resetModules();
    jest.requireActual('./main');
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));
  };

  beforeEach(() => {
    Object.keys(mockEnvironment).forEach((key) => delete mockEnvironment[key]);
    Object.assign(mockEnvironment, {
      KEYCLOAK_ROOT_URL: 'http://keycloak.example',
      DIRECTORY_URL: 'http://directory.example',
      CLIENT_ID: 'urn:ads:platform:sharepoint-service',
      CLIENT_SECRET: 'secret',
      PORT: 3350,
    });
    mockExpress.mockReturnValue(mockApp);
    mockExpress.json.mockReturnValue('json-middleware');
    mockInitializePlatform.mockResolvedValue(platform);
    healthCheck.mockResolvedValue({ access: 'ok' });
    mockCreateSharePointRouter.mockReturnValue('sharepoint-router');
    mockApp.listen.mockReturnValue({ on: jest.fn() });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('starts listening on the configured port', async () => {
    await startMain();

    expect(mockApp.listen).toHaveBeenCalledWith(3350, expect.any(Function));
  });

  it('logs once the server starts listening', async () => {
    await startMain();

    const [, onListening] = mockApp.listen.mock.calls[0];
    onListening();

    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('SharePoint service listening'));
  });

  it('logs a server error from the listen callback', async () => {
    const onError = jest.fn();
    mockApp.listen.mockReturnValue({ on: onError });

    await startMain();

    const [, errorHandler] = onError.mock.calls[0];
    errorHandler(new Error('port in use'));

    expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('port in use'));
  });

  it('registers the health endpoint', async () => {
    await startMain();

    const healthRoute = mockApp.get.mock.calls.find(([path]) => path === '/health');

    expect(healthRoute).toBeTruthy();
  });

  it('reports the platform health check result from the health endpoint', async () => {
    await startMain();

    const [, handler] = mockApp.get.mock.calls.find(([path]) => path === '/health');
    const res = { json: jest.fn() };
    await handler({}, res);

    expect(res.json).toHaveBeenCalledWith({ access: 'ok' });
  });

  it('mounts the SharePoint router under tenant authentication', async () => {
    await startMain();

    const mounted = mockApp.use.mock.calls.find(([path]) => path === '/sharepoint/v1/sharepoint');

    expect(mounted).toEqual(['/sharepoint/v1/sharepoint', undefined, 'tenant-handler', 'sharepoint-router']);
  });

  it('serializes the user as-is', async () => {
    await startMain();
    const passport = jest.requireMock('passport');
    const [serialize] = passport.serializeUser.mock.calls[0];
    const done = jest.fn();

    serialize({ id: 'user-1' }, done);

    expect(done).toHaveBeenCalledWith(null, { id: 'user-1' });
  });

  it('deserializes the user as-is', async () => {
    await startMain();
    const passport = jest.requireMock('passport');
    const [deserialize] = passport.deserializeUser.mock.calls[0];
    const done = jest.fn();

    deserialize({ id: 'user-1' }, done);

    expect(done).toHaveBeenCalledWith(null, { id: 'user-1' });
  });

  it('logs and exits when platform initialization fails', async () => {
    mockInitializePlatform.mockRejectedValue(new Error('cannot reach directory'));
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    await startMain();

    expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('cannot reach directory'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
