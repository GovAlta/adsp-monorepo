import { createLogger } from './logging';

// We might need to think of using the the environment.LOG_LEVEL from the external service in the future.
export const logger = createLogger('core-service', process.env.LOG_LEVEL || 'info');
