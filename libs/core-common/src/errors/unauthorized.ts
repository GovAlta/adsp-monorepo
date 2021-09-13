import { GoAError } from "@abgov/adsp-service-sdk";
export class UnauthorizedError extends GoAError {
  constructor(message?: string) {
    super(message);

    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}
