export class NotFoundError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.name = 'NotFoundError'
    this.statusCode = statusCode
  }
}

export class DatabaseError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.name = 'DatabaseError'
    this.statusCode = statusCode
  }
}
