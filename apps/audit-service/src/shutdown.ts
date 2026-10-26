import type { Server } from 'http';
import type { AuditApplication } from './app';

// 10s withdrawal + 25s buffer flush + 10s cleanup, within the manifest's 60s grace period.
export const TRAFFIC_WITHDRAWAL_MS = 10_000;
export const PROCESS_SHUTDOWN_TIMEOUT_MS = 45_000;

export async function shutdownServer(
  server: Server,
  app: Pick<AuditApplication, 'beginShutdown' | 'drain' | 'shutdown'>,
): Promise<void> {
  app.beginShutdown();
  await new Promise<void>((resolve) => setTimeout(resolve, TRAFFIC_WITHDRAWAL_MS));
  const closed = new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
    server.closeIdleConnections();
  });
  await Promise.all([closed, app.drain()]);
  await app.shutdown();
}
