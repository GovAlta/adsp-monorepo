import { createLogger } from '@core-services/core-common';
import { initializeApp } from './app';
import { environment } from './environments/environment';
import { PROCESS_SHUTDOWN_TIMEOUT_MS, shutdownServer } from './shutdown';

const logger = createLogger('audit-service', environment.LOG_LEVEL);

initializeApp()
  .then((app) => {
    const port = environment.PORT || 3352;

    const server = app.listen(port, () => {
      logger.info(`Listening at http://localhost:${port}`);
    });
    server.on('error', (err) => logger.error(`Error encountered in server: ${err}`));
    let stopping = false;
    const stop = async () => {
      if (stopping) return;
      stopping = true;
      const deadline = setTimeout(() => {
        logger.error('Audit shutdown deadline exceeded; unacknowledged requests must be retried.');
        process.exit(1);
      }, PROCESS_SHUTDOWN_TIMEOUT_MS);
      deadline.unref();
      try {
        await shutdownServer(server, app);
        clearTimeout(deadline);
        process.exit(0);
      } catch (error) {
        logger.error(`Audit shutdown failed: ${error}`);
        process.exit(1);
      }
    };
    process.once('SIGTERM', stop);
    process.once('SIGINT', stop);
  })
  .catch((error) => {
    logger.error(`Audit service startup failed: ${error}`);
    process.exit(1);
  });
