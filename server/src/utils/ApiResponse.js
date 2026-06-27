class ApiResponse {
  constructor(statusCode, message = "Success", data) {
    this.data = data;
    this.message = message;
    this.statusCode = statusCode;
    this.success = true;
  }
}
export { ApiResponse };
