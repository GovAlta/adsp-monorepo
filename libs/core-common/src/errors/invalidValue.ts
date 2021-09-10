export class InvalidValueError extends Error {
  constructor(context: string, errors: string) {
    super(`Value not valid for ${context}: ${errors}`);

    Object.setPrototypeOf(this, InvalidValueError.prototype);
  }
}
