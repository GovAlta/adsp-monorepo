import { GoAError } from "@abgov/adsp-service-sdk";

export class InvalidOperationError extends GoAError {
  constructor(message?: string) {
    super(message);

    Object.setPrototypeOf(this, InvalidOperationError.prototype);
  }
}