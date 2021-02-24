export class ApiError extends Error {
  statusCode: string;
  /**
   * Operational errors are not bugs and can occur from time to time mostly
   * because of one or a combination of several external factors like a database
   * server timing out or a user deciding to make an attempt on SQL injection by
   * entering SQL queries in an input field
   *
   * */
  isOperational: boolean;
  message: string;

  constructor(statusCode, message, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.message = message;
  }
  getJson = () => {
    return {
      code: this.statusCode,
      message: this.message,
      isOpertional: this.isOperational,
    };
  };
}
