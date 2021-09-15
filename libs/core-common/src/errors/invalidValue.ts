import { GoAError, GoAErrorExtra } from "@abgov/adsp-service-sdk";

export class InvalidValueError extends GoAError {
  constructor(context: string, errors: string, extra?: GoAErrorExtra) {
    super(`Value not valid for ${context}: ${errors}`, extra);

    Object.setPrototypeOf(this, InvalidValueError.prototype);
  }
}
