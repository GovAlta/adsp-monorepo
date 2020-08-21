export class UnauthorizedError extends Error {
  constructor(message?: string) {
    super(message);

    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}
