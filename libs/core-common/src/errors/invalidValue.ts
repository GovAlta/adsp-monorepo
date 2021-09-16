import { GoAError, GoAErrorExtra } from "@abgov/adsp-service-sdk";
import * as HttpStatusCodes from 'http-status-codes';

export class InvalidValueError extends GoAError {
  constructor(context: string, errors: string, extra?: GoAErrorExtra) {
    super(`Value not valid for ${context}: ${errors}`,
      { statusCode: HttpStatusCodes.BAD_REQUEST, ...extra });

    Object.setPrototypeOf(this, InvalidValueError.prototype);
  }
}
