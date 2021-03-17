import { logger } from '../../../middleware/logger';

export class TenantError extends Error {
  errorCode: number;
  constructor(message, errorCode) {
    super(message);

    Error.captureStackTrace(this, this.constructor);
    logger.error(message);

    this.message = message || '[Tenant] Unexpected error';

    this.errorCode = errorCode;
  }
}
