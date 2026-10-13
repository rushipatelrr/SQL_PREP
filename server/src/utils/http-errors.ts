export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = new.target.name;
  }
}

export class BadRequestError extends HttpError {
  constructor(message = 'Bad request.') {
    super(400, message);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'You must be signed in to do that.') {
    super(401, message);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = "You don't have access to that.") {
    super(403, message);
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Not found.') {
    super(404, message);
  }
}
