jest.mock('pg', () => ({ Pool: jest.fn() }));

import { Pool } from 'pg';
import { createLogger, transports } from 'winston';
import { createDatabaseProbe, HEALTH_CHECK_TIMEOUT_MS } from './health';

describe('audit database readiness probe', () => {
  const logger = createLogger({ transports: [new transports.Console({ silent: true })] });
  const client = { query: jest.fn(), release: jest.fn() };
  const pool = { connect: jest.fn(), end: jest.fn(), on: jest.fn() };
  let probe: ReturnType<typeof createDatabaseProbe>;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    jest.mocked(Pool).mockImplementation(jest.fn().mockReturnValue(pool));
    pool.connect.mockResolvedValue(client);
    pool.end.mockResolvedValue(undefined);
    client.query.mockResolvedValue({ rows: [{ result: 1 }] });
    probe = createDatabaseProbe({ host: 'audit-database', database: 'audit' }, logger);
  });

  afterEach(async () => {
    await probe.close();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('bounds connection acquisition and statements independently of the application pool', () => {
    expect(Pool).toHaveBeenCalledWith(
      expect.objectContaining({
        max: 1,
        connectionTimeoutMillis: 250,
        query_timeout: 250,
        statement_timeout: 250,
      }),
    );
  });

  it('reports a successful query and returns the connection to the pool', async () => {
    const result = await probe.isConnected();

    expect(result).toBe(true);
    expect(client.query).toHaveBeenCalledWith('SELECT 1');
    expect(client.release).toHaveBeenCalledWith(false);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('destroys failed connections without logging credentials or internal error text', async () => {
    const warning = jest.spyOn(logger, 'warn');
    client.query.mockRejectedValue(new Error('postgres://private-credentials'));

    const result = await probe.isConnected();

    expect(result).toBe(false);
    expect(client.release).toHaveBeenCalledWith(true);
    expect(warning).toHaveBeenCalledWith('Audit database is not ready.', { context: 'AuditHealth' });
  });

  it('reports acquisition failure without needing an application pool connection', async () => {
    pool.connect.mockRejectedValue(new Error('Connection refused'));

    await expect(probe.isConnected()).resolves.toBe(false);

    expect(client.query).not.toHaveBeenCalled();
  });

  it('shares an in-flight check across concurrent readiness requests', async () => {
    const first = probe.isConnected();
    const second = probe.isConnected();

    expect(first).toBe(second);
    await first;
    expect(pool.connect).toHaveBeenCalledTimes(1);
  });

  it('returns within 750ms and destroys a connection with a stalled query', async () => {
    client.query.mockImplementationOnce(() => new Promise(() => undefined));
    const result = probe.isConnected();

    await jest.advanceTimersByTimeAsync(HEALTH_CHECK_TIMEOUT_MS);

    await expect(result).resolves.toBe(false);
    expect(client.release).toHaveBeenCalledWith(true);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('destroys a connection acquired after the overall deadline without querying it', async () => {
    let connected: (value: typeof client) => void;
    pool.connect.mockImplementationOnce(() => new Promise((resolve) => (connected = resolve)));
    const result = probe.isConnected();
    await jest.advanceTimersByTimeAsync(HEALTH_CHECK_TIMEOUT_MS);
    await expect(result).resolves.toBe(false);

    connected(client);
    await jest.advanceTimersByTimeAsync(0);

    expect(client.query).not.toHaveBeenCalled();
    expect(client.release).toHaveBeenCalledWith(true);
  });

  it('does not release a timed-out client twice when its query eventually fails', async () => {
    let fail: (reason: Error) => void;
    client.query.mockImplementationOnce(() => new Promise((_resolve, reject) => (fail = reject)));
    const result = probe.isConnected();
    await jest.advanceTimersByTimeAsync(HEALTH_CHECK_TIMEOUT_MS);
    await result;

    fail(new Error('Connection closed'));
    await jest.advanceTimersByTimeAsync(0);

    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it('checks again and recovers after a database failure', async () => {
    client.query.mockRejectedValueOnce(new Error('Connection lost'));
    await expect(probe.isConnected()).resolves.toBe(false);

    await expect(probe.isConnected()).resolves.toBe(true);

    expect(pool.connect).toHaveBeenCalledTimes(2);
  });

  it('recovers on the next check after a timed-out query', async () => {
    client.query.mockImplementationOnce(() => new Promise(() => undefined));
    const first = probe.isConnected();
    await jest.advanceTimersByTimeAsync(HEALTH_CHECK_TIMEOUT_MS);
    await first;

    await expect(probe.isConnected()).resolves.toBe(true);
  });

  it('handles idle client errors without exposing their details', () => {
    const warning = jest.spyOn(logger, 'warn');
    const onError = pool.on.mock.calls[0][1];

    onError(new Error('Private connection details'));

    expect(warning).toHaveBeenCalledWith('Audit readiness connection failed.', { context: 'AuditHealth' });
  });
});
