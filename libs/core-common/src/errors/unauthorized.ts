import { GoAError, GoAErrorExtra } from "@abgov/adsp-service-sdk";
export class UnauthorizedError extends GoAError {
  constructor(message?: string, extra?: GoAErrorExtra) {
    super(message, extra);

    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}
