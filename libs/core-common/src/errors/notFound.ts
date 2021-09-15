import { GoAError, GoAErrorExtra } from "@abgov/adsp-service-sdk";
export class NotFoundError extends GoAError {
  constructor(type: string, id?: string, extra?: GoAErrorExtra) {
    super(`${type} with ID '${id}' could not be found.`, extra);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}
