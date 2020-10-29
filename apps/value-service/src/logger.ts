import { createLogger } from '@core-services/core-common';
import { environment } from './environments/environment';

const { LOG_LEVEL } = environment;

export const logger = createLogger('values-service', LOG_LEVEL);
