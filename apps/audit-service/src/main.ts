import { createLogger } from '@core-services/core-common';
import { initializeApp } from './app';
import { environment } from './environments/environment';

const logger = createLogger('audit-service', environment.LOG_LEVEL);

initializeApp().then((app) => {
  const port = environment.PORT || 3352;

  const server = app.listen(port, () => {
    logger.info(`Listening at http://localhost:${port}`);
  });
  server.on('error', (err) => logger.error(`Error encountered in server: ${err}`));
});
