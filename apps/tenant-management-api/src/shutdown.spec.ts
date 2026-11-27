import { Logger } from 'winston';
import { createShutdownHandler } from './shutdown';
import { ProvisioningTracker } from './tenant/provisioning';

describe('createShutdownHandler', () => {
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as Logger;
  const steps: string[] = [];
  const server = { close: jest.fn(() => steps.push('close')) };
  const disconnect = jest.fn(async () => {
    steps.push('disconnect');
  });
  const exit = jest.fn((code: number) => steps.push(`exit ${code}`));

  const createHandler = (provisioning: ProvisioningTracker, timeoutMs = 1000) =>
    createShutdownHandler({ logger, server, provisioning, timeoutMs, disconnect, exit });

  beforeEach(() => {
    jest.clearAllMocks();
    steps.length = 0;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('can stop taking requests, wait for provisioning, then disconnect and exit', async () => {
    const provisioning = new ProvisioningTracker();
    let finishRealm: () => void;
    provisioning.track(
      new Promise<void>((resolve) => (finishRealm = resolve)).then(() => {
        steps.push('provisioned');
      }),
    );

    const shutdown = createHandler(provisioning)('Shutting down.', 1, null);
    await Promise.resolve();
    expect(steps).toEqual(['close']);

    finishRealm();
    await shutdown;

    expect(steps).toEqual(['close', 'provisioned', 'disconnect', 'exit 1']);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('can exit after the time limit when provisioning is still in progress', async () => {
    jest.useFakeTimers();
    const provisioning = new ProvisioningTracker();
    provisioning.track(new Promise<void>(() => undefined));

    const shutdown = createHandler(provisioning, 20000)('Shutting down.', 1, null);
    await jest.advanceTimersByTimeAsync(20000);
    await shutdown;

    expect(steps).toEqual(['close', 'disconnect', 'exit 1']);
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('1 tenant realm'));
  });

  it('can shut down once when signalled more than once', async () => {
    const handler = createHandler(new ProvisioningTracker());

    await Promise.all([handler('Shutting down.', 1, null), handler('Shutting down.', 1, null)]);

    expect(server.close).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledTimes(1);
  });

  it('can log the error that caused the shutdown', async () => {
    const err = new Error('oh noes!');

    await createHandler(new ProvisioningTracker())('Uncaught exception.', 1, err);

    expect(logger.error).toHaveBeenCalledWith('Uncaught exception.', err);
    expect(exit).toHaveBeenCalledWith(1);
  });
});
