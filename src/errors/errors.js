export class DefaultError extends Error {
  constructor(name, message, statusCode) {
    super(message)
    this.name = name
    this.statusCode = statusCode
  }
}
