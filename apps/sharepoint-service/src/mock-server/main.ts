import { createLogger } from '@core-services/core-common';
import { startSharePointMockServer } from './server';

const logger = createLogger('sharepoint-mock-server', process.env.LOG_LEVEL || 'info');

startSharePointMockServer(Number(process.env.MOCK_PORT || 3399))
  .then(({ url }) => logger.info(`SharePoint mock server listening at ${url} (viewer: ${url}/_mock)`))
  .catch((err) => {
    logger.error(`Failed to start SharePoint mock server: ${err}`);
    process.exit(1);
  });
