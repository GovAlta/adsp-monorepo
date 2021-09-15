import { GoAError, GoAErrorExtra } from "@abgov/adsp-service-sdk";
import * as HttpStatusCodes from 'http-status-codes';
export class NotFoundError extends GoAError {
  constructor(type: string, id?: string, extra?: GoAErrorExtra) {
    super(`${type} with ID '${id}' could not be found.`,
      { statusCode: HttpStatusCodes.NOT_FOUND, ...extra });
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}
