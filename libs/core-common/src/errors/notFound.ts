import { GoAError } from "@abgov/adsp-service-sdk";
export class NotFoundError extends GoAError {
  constructor(type: string, id?: string) {
    super(`${type} with ID '${id}' could not be found.`);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}
