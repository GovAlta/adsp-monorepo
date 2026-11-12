import type { AuditService } from '@abgov/adsp-service-sdk';
import type { Server } from 'http';
import type { Logger } from 'winston';

// Below the 30 second termination grace period of the deployment.
const SHUTDOWN_TIMEOUT_MS = 25000;

interface ShutdownProps {
  server: Pick<Server, 'close'>;
  auditService: Pick<AuditService, 'flush'>;
  shutdownTelemetry: () => Promise<void>;
  closeDatabase: () => Promise<void>;
  logger: Logger;
  exit?: (code: number) => void;
  timeoutMs?: number;
}

/**
 * Creates the handler for termination signals. In-flight requests are allowed to complete before audit events they
 * recorded are delivered, then the database connection is closed and telemetry is flushed before the process exits.
 *
 * The SDK flushes telemetry on its own signal listener, but does not wait when another listener owns the exit, so the
 * handler awaits the same flush before exiting. The SDK does not flush audit events on shutdown.
 */
export function createShutdownHandler({
  server,
  auditService,
  shutdownTelemetry,
  closeDatabase,
  logger,
  exit = (code) => process.exit(code),
  timeoutMs = SHUTDOWN_TIMEOUT_MS,
}: ShutdownProps): () => Promise<void> {
  let stopping = false;

  return async () => {
    if (stopping) {
      return;
    }
    stopping = true;

    logger.info('Project planner service is shutting down; waiting for in-flight requests to complete...');
    // Fallback in case requests do not drain or a step hangs.
    setTimeout(() => {
      logger.error(`Project planner service did not shut down within ${timeoutMs} ms; exiting.`);
      exit(1);
    }, timeoutMs).unref();

    let code = 0;
    try {
      await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
    } catch (err) {
      code = 1;
      logger.error(`Error encountered closing the server on shutdown: ${err}`);
    }

    await auditService.flush();

    try {
      await closeDatabase();
    } catch (err) {
      code = 1;
      logger.error(`Error encountered closing the database connection on shutdown: ${err}`);
    }

    await shutdownTelemetry();

    logger.info('Project planner service shut down.');
    exit(code);
  };
}
