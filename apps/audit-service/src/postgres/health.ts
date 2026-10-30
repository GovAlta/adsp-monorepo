import { Pool, PoolClient, PoolConfig } from 'pg';
import type { Logger } from 'winston';

export const HEALTH_CHECK_TIMEOUT_MS = 750;
const CONNECTION_TIMEOUT_MS = 250;

export function createDatabaseProbe(connection: PoolConfig, logger: Logger) {
  // A stalled application pool must not queue probes behind long history queries.
  const pool = new Pool({
    ...connection,
    max: 1,
    connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
    idleTimeoutMillis: 10_000,
    query_timeout: CONNECTION_TIMEOUT_MS,
    statement_timeout: CONNECTION_TIMEOUT_MS,
  });
  pool.on('error', () => logger.warn('Audit readiness connection failed.', { context: 'AuditHealth' }));
  let pending: Promise<boolean> | undefined;

  return {
    isConnected: () => {
      pending ??= checkConnection(pool, logger).finally(() => {
        pending = undefined;
      });
      return pending;
    },
    close: () => pool.end(),
  };
}

async function checkConnection(pool: Pool, logger: Logger): Promise<boolean> {
  let client: PoolClient | undefined;
  let released = false;
  let expired = false;
  let timer: NodeJS.Timeout;
  const release = (destroy: boolean) => {
    if (client && !released) {
      released = true;
      client.release(destroy);
    }
  };
  const deadline = new Promise<boolean>((resolve) => {
    timer = setTimeout(() => {
      expired = true;
      release(true);
      logger.warn('Audit readiness check timed out.', { context: 'AuditHealth' });
      resolve(false);
    }, HEALTH_CHECK_TIMEOUT_MS);
  });
  const query = (async () => {
    let healthy = false;
    try {
      client = await pool.connect();
      if (expired) return false;
      await client.query('SELECT 1');
      healthy = !expired;
      return healthy;
    } catch {
      logger.warn('Audit database is not ready.', { context: 'AuditHealth' });
      return false;
    } finally {
      release(!healthy);
    }
  })();
  try {
    return await Promise.race([query, deadline]);
  } finally {
    clearTimeout(timer);
  }
}
