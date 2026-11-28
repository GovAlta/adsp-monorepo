import { Logger } from 'winston';
import { ProvisioningTracker } from './tenant/provisioning';

interface ShutdownProps {
  logger: Logger;
  server: { close: () => unknown };
  provisioning: ProvisioningTracker;
  timeoutMs: number;
  disconnect: (logger: Logger) => Promise<void>;
  exit: (code: number) => void;
}

/**
 * Stops taking requests, waits up to `timeoutMs` for tenant realms still being provisioned, then disconnects and
 * exits. Provisioning saves the tenant when it finishes, so the database stays connected until then.
 */
export function createShutdownHandler({ logger, server, provisioning, timeoutMs, disconnect, exit }: ShutdownProps) {
  let shuttingDown = false;

  return async (message: string, code: number, err: Error | null): Promise<void> => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;

    server.close();
    if (provisioning.count > 0) {
      logger.info(`Waiting up to ${timeoutMs} ms for ${provisioning.count} tenant realm(s) still being provisioned...`);
    }
    if (!(await provisioning.drain(timeoutMs))) {
      logger.warn(
        `Shutting down with ${provisioning.count} tenant realm(s) still being provisioned; ` +
          'the provisioning recovery job removes them once they are stale.',
      );
    }

    await disconnect(logger);
    if (err === null) {
      logger.info(message);
    } else {
      logger.error(message, err);
    }
    exit(code);
  };
}
