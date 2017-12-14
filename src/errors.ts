import * as httpStatus from 'http-status';

export class MicroChassisError extends Error {
  public readonly status?: number = httpStatus.INTERNAL_SERVER_ERROR;

  get content(): string {
    return this.message;
  }
}

export class NotFoundError extends MicroChassisError {
  public readonly status = httpStatus.NOT_FOUND;
}

export class ValidationError extends MicroChassisError {
  public readonly status = httpStatus.BAD_REQUEST;
}

export class UnauthorizedError extends MicroChassisError {
  public readonly status = httpStatus.UNAUTHORIZED;
}

export class ForbiddenError extends MicroChassisError {
  public readonly status = httpStatus.FORBIDDEN;
}
