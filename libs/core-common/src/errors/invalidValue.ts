import { GoAError } from "@abgov/adsp-service-sdk";

export class InvalidValueError extends GoAError {
  constructor(context: string, errors: string) {
    super(`Value not valid for ${context}: ${errors}`);

    Object.setPrototypeOf(this, InvalidValueError.prototype);
  }
}
