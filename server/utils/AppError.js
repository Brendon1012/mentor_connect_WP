// An error we throw on purpose. The error handler sends its message to the client;
// any other error is treated as unexpected and gets a generic 500 message.
export default class AppError extends Error {
  constructor(statusCode, message, errors) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
  }
}
