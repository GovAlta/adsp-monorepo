import { Logger } from 'winston';
import { createSharePointRetryJob } from './sharepointRetry';

describe('createSharePointRetryJob', () => {
  const logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as Logger;
  const service = { push: jest.fn(), retryDue: jest.fn() };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('retries the pushes that are due and logs how many were attempted', async () => {
    service.retryDue.mockResolvedValue(2);

    await createSharePointRetryJob({ logger, service })();

    expect(service.retryDue).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('2 push'));
  });

  it('stays quiet when nothing was due', async () => {
    service.retryDue.mockResolvedValue(0);

    await createSharePointRetryJob({ logger, service })();

    expect(logger.info).not.toHaveBeenCalled();
  });

  it('logs the error and runs again next time when a run fails', async () => {
    service.retryDue.mockRejectedValueOnce(new Error('db down')).mockResolvedValueOnce(0);
    const job = createSharePointRetryJob({ logger, service });

    await expect(job()).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('db down'));

    await job();
    expect(service.retryDue).toHaveBeenCalledTimes(2);
  });

  it('skips a run that starts while the previous run is still going', async () => {
    let finish: (attempted: number) => void;
    service.retryDue.mockReturnValueOnce(new Promise<number>((resolve) => (finish = resolve)));
    const job = createSharePointRetryJob({ logger, service });

    const first = job();
    await job();
    expect(service.retryDue).toHaveBeenCalledTimes(1);

    finish(0);
    await first;
  });
});
