export class InvalidOperationError extends Error {
  constructor(message?: string) {
    super(message);

    Object.setPrototypeOf(this, InvalidOperationError.prototype);
  }
}
