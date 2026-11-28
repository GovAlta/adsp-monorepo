import { InvalidOperationError, NotFoundError } from '@core-services/core-common';
import axios from 'axios';
import * as HttpStatusCodes from 'http-status-codes';

/**
 * Translates a configuration-service failure into the status form-service should respond with.
 *
 * A 4xx (other than 401/403, which mean form-service's own service account is missing a role) is the caller's
 * fault and maps to 400. Anything else configuration-service does wrong is not the caller's fault, so it maps to
 * 502 rather than a plain GoAError, which createErrorHandler would otherwise turn into a 500. Pass `notFound`
 * where a 404 means the caller's own resource is gone, so it is reported as 404 instead of 400.
 */
export const mapConfigurationError = (err: unknown, notFound?: { type: string; id: string }): Error => {
  if (err instanceof NotFoundError || err instanceof InvalidOperationError) {
    return err;
  }

  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const message = (err.response?.data as { errorMessage?: string })?.errorMessage || err.message;

    if (notFound && status === HttpStatusCodes.NOT_FOUND) {
      return new NotFoundError(notFound.type, notFound.id);
    }

    const isCallerFault =
      status >= HttpStatusCodes.BAD_REQUEST &&
      status < HttpStatusCodes.INTERNAL_SERVER_ERROR &&
      status !== HttpStatusCodes.UNAUTHORIZED &&
      status !== HttpStatusCodes.FORBIDDEN;

    return isCallerFault
      ? new InvalidOperationError(message)
      : new InvalidOperationError(message, { statusCode: HttpStatusCodes.BAD_GATEWAY });
  }

  return err as Error;
};
