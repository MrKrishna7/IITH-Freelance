class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went Wrong",
    errors = [],
    stack
  ) {
    super(message);
    this.errors = errors;
    this.data = null;
    this.statusCode = statusCode;
    this.message = message;
    this.success = false;
    console.log(message);
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
export { ApiError };
