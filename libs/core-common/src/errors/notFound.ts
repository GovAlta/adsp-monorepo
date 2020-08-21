export class NotFoundError extends Error {
  constructor(type: string, id: string) {
    super(`${type} with ID '${id}' could not be found.`);

    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}
