import { GoAError, GoAErrorExtra } from "@abgov/adsp-service-sdk";
import * as HttpStatusCodes from 'http-status-codes';
export class UnauthorizedError extends GoAError {
  constructor(message?: string, extra?: GoAErrorExtra) {
    super(message, { statusCode: HttpStatusCodes.UNAUTHORIZED, ...extra });
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}
