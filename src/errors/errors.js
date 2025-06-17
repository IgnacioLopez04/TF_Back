export class DefaultError extends Error {
  constructor(name, message, statusCode) {
    super(message);
    this.name = name;
    this.statusCode = statusCode;
  }
}

export class BadRequestError extends DefaultError {
  constructor(message = 'Bad Request') {
    super('BadRequestError', message, 400);
  }
}

export class ForbiddenError extends DefaultError {
  constructor(message = 'Forbidden') {
    super('ForbiddenError', message, 403);
  }
}

export class NotFoundError extends DefaultError {
  constructor(message = 'Not Found') {
    super('NotFoundError', message, 404);
  }
}

export class InternalServerError extends DefaultError {
  constructor(message = 'Internal Server Error') {
    super('InternalServerError', message, 500);
  }
}
