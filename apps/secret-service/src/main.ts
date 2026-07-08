import { createLogger } from '@core-services/core-common';
import { environment } from './environments/environment';
import { createApp, startSecretService } from './server';

const logger = createLogger('secret-service', environment.LOG_LEVEL);
const app = createApp(logger);

startSecretService({ app, environment, logger });
