// Custom error carrying an HTTP status code.
export default class ApiError extends Error {
  constructor(statusCode, message) {
    super(message)
    this.statusCode = statusCode
  }
}
