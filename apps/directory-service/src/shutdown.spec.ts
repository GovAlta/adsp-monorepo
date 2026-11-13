import { Logger } from 'winston';
import { createShutdownHandler } from './shutdown';

describe('createShutdownHandler', () => {
  const logger = { info: jest.fn(), error: jest.fn() } as unknown as Logger;

  const setup = (closeError?: Error) => {
    const steps: string[] = [];
    let finishRequests: () => void;
    const server = {
      close: jest.fn((callback: (err?: Error) => void) => {
        steps.push('close');
        finishRequests = () => {
          steps.push('requests-drained');
          callback(closeError);
        };
        return server;
      }),
    };
    const auditService = { flush: jest.fn(async () => void steps.push('audit-flush')) };
    const shutdownTelemetry = jest.fn(async () => void steps.push('telemetry-shutdown'));
    const exit = jest.fn((code: number) => void steps.push(`exit-${code}`));

    const shutdown = createShutdownHandler({
      server: server as never,
      auditService,
      shutdownTelemetry,
      logger,
      exit,
    });

    return { steps, shutdown, server, auditService, exit, finishRequests: () => finishRequests() };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('waits for in-flight requests before flushing audit events, then flushes telemetry', async () => {
    const { steps, shutdown, auditService, finishRequests } = setup();

    const done = shutdown();
    await Promise.resolve();
    expect(steps).toEqual(['close']);
    expect(auditService.flush).not.toHaveBeenCalled();

    finishRequests();
    await done;

    expect(steps).toEqual(['close', 'requests-drained', 'audit-flush', 'telemetry-shutdown', 'exit-0']);
  });

  it('runs once when signalled more than once', async () => {
    const { shutdown, server, finishRequests, exit } = setup();

    const first = shutdown();
    await shutdown();
    finishRequests();
    await first;

    expect(server.close).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledTimes(1);
  });

  it('still flushes and exits with an error code when the server fails to close', async () => {
    const { steps, shutdown, finishRequests } = setup(new Error('not running'));

    const done = shutdown();
    finishRequests();
    await done;

    expect(steps).toEqual(['close', 'requests-drained', 'audit-flush', 'telemetry-shutdown', 'exit-1']);
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('not running'));
  });

  it('exits with an error code when audit events fail to flush', async () => {
    const { shutdown, auditService, finishRequests, exit } = setup();
    auditService.flush.mockRejectedValueOnce(new Error('oh noes!'));

    const done = shutdown();
    finishRequests();
    await done;

    expect(exit).toHaveBeenCalledWith(1);
  });

  it('exits after the timeout if requests do not drain', async () => {
    jest.useFakeTimers();
    try {
      const exit = jest.fn();
      const shutdown = createShutdownHandler({
        server: { close: jest.fn() } as never,
        auditService: { flush: jest.fn() },
        shutdownTelemetry: jest.fn(),
        logger,
        exit,
        timeoutMs: 1000,
      });

      void shutdown();
      jest.advanceTimersByTime(1000);

      expect(exit).toHaveBeenCalledWith(1);
    } finally {
      jest.useRealTimers();
    }
  });
});
