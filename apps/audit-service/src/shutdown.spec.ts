import { createServer } from 'http';
import { shutdownServer, TRAFFIC_WITHDRAWAL_MS } from './shutdown';

describe('audit HTTP shutdown', () => {
  const app = {
    beginShutdown: jest.fn(),
    drain: jest.fn(),
    shutdown: jest.fn(),
  };
  const server = createServer();

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    app.drain.mockResolvedValue(undefined);
    app.shutdown.mockResolvedValue(undefined);
    jest.spyOn(server, 'close').mockImplementation((callback) => {
      callback();
      return server;
    });
    jest.spyOn(server, 'closeIdleConnections').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('withdraws readiness before closing the listener or refusing buffered writes', async () => {
    const stopping = shutdownServer(server, app);

    expect(app.beginShutdown).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(TRAFFIC_WITHDRAWAL_MS - 1);
    expect(server.close).not.toHaveBeenCalled();
    expect(app.drain).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(1);
    await stopping;
  });

  it('waits for both active HTTP requests and the buffer before closing database and telemetry', async () => {
    let finishRequests: () => void;
    let finishBuffer: () => void;
    jest.spyOn(server, 'close').mockImplementation((callback) => {
      finishRequests = () => callback();
      return server;
    });
    app.drain.mockImplementationOnce(() => new Promise<void>((resolve) => (finishBuffer = resolve)));
    const stopping = shutdownServer(server, app);
    await jest.advanceTimersByTimeAsync(TRAFFIC_WITHDRAWAL_MS);

    finishRequests();
    await jest.advanceTimersByTimeAsync(0);
    expect(app.shutdown).not.toHaveBeenCalled();
    finishBuffer();
    await stopping;

    expect(app.shutdown).toHaveBeenCalledTimes(1);
    expect(server.closeIdleConnections).toHaveBeenCalledTimes(1);
  });

  it('propagates a failed buffer drain instead of reporting successful shutdown', async () => {
    app.drain.mockRejectedValueOnce(new Error('Buffer did not flush'));
    const result = expect(shutdownServer(server, app)).rejects.toThrow('Buffer did not flush');

    await jest.advanceTimersByTimeAsync(TRAFFIC_WITHDRAWAL_MS);
    await result;
  });
});
