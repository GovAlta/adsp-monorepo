import { GoAError, GoAErrorExtra } from "@abgov/adsp-service-sdk";
import * as HttpStatusCodes from 'http-status-codes';

export class InvalidOperationError extends GoAError {
  constructor(message?: string, extra?: GoAErrorExtra) {
    super(message, { statusCode: HttpStatusCodes.BAD_REQUEST, ...extra });

    Object.setPrototypeOf(this, InvalidOperationError.prototype);
  }
}