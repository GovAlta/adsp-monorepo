import { createLogger } from '@core-services/core-common';
import { environment } from '../environments/environment';

export const logger = createLogger('tenant-management-api', environment.LOG_LEVEL || 'debug');

