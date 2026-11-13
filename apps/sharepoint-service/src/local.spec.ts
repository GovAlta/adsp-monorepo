const mockLocalApp = { use: jest.fn(), get: jest.fn(), listen: jest.fn() };
const mockLocalExpress = Object.assign(jest.fn(), { json: jest.fn() });
const mockLocalCors = jest.fn();
const mockLocalLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };
const mockLocalCreateLogger = jest.fn();
const mockLocalCreateErrorHandler = jest.fn();
const mockLocalCreateSharePointRouter = jest.fn();

jest.mock('express', () => mockLocalExpress);
jest.mock('cors', () => mockLocalCors);
jest.mock('@core-services/core-common', () => ({
  createLogger: mockLocalCreateLogger,
  createErrorHandler: mockLocalCreateErrorHandler,
}));
jest.mock('./sharepoint', () => ({
  createSharePointRouter: mockLocalCreateSharePointRouter,
  SharePointServiceRoles: { Admin: 'sharepoint-admin', Writer: 'sharepoint-writer' },
}));

describe('local', () => {
  const originalEnv = process.env;
  const errorHandler = jest.fn();

  const startLocal = async (env: Record<string, string> = {}) => {
    process.env = { ...env };
    jest.resetModules();
    jest.requireActual('./local');
    await new Promise((resolve) => setImmediate(resolve));
  };

  const findUse = (path: string) => mockLocalApp.use.mock.calls.filter(([first]) => first === path);

  beforeEach(() => {
    mockLocalExpress.mockReturnValue(mockLocalApp);
    mockLocalExpress.json.mockReturnValue('json-middleware');
    mockLocalCors.mockReturnValue('cors-middleware');
    mockLocalCreateLogger.mockReturnValue(mockLocalLogger);
    mockLocalCreateErrorHandler.mockReturnValue(errorHandler);
    mockLocalCreateSharePointRouter.mockReturnValue('sharepoint-router');
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.resetAllMocks();
  });

  it('listens on the default port 3350', async () => {
    await startLocal();

    expect(mockLocalApp.listen).toHaveBeenCalledWith(3350, expect.any(Function));
  });

  it('listens on a port from the environment when provided', async () => {
    await startLocal({ PORT: '4000' });

    expect(mockLocalApp.listen).toHaveBeenCalledWith(4000, expect.any(Function));
  });

  it('logs once the server starts listening', async () => {
    await startLocal();

    const [, onListening] = mockLocalApp.listen.mock.calls[0];
    onListening();

    expect(mockLocalLogger.info).toHaveBeenCalledWith(expect.stringContaining('SharePoint service local mode'));
  });

  it('mounts the SharePoint router', async () => {
    await startLocal();

    const mounted = findUse('/sharepoint/v1/sharepoint').find(([, handler]) => handler === 'sharepoint-router');

    expect(mounted).toBeTruthy();
  });

  it('injects a fake dev user with admin and writer roles ahead of the router', async () => {
    await startLocal();

    const [, injectUser] = findUse('/sharepoint/v1/sharepoint')[0];
    const req: Record<string, unknown> = {};
    const next = jest.fn();
    injectUser(req, {}, next);

    expect(req.user).toEqual(
      expect.objectContaining({ id: 'local-dev-user', roles: ['sharepoint-admin', 'sharepoint-writer'] }),
    );
    expect(next).toHaveBeenCalled();
  });

  it('reports ok with local mode on the health endpoint', async () => {
    await startLocal();

    const [, handler] = mockLocalApp.get.mock.calls.find(([path]) => path === '/health');
    const res = { json: jest.fn() };
    handler({}, res);

    expect(res.json).toHaveBeenCalledWith({ status: 'ok', mode: 'local' });
  });
});
