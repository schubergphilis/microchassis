import * as httpStatus from 'http-status';
import * as grpc from 'grpc';

export class MicroChassisError extends Error {
  public readonly status?: number = httpStatus.INTERNAL_SERVER_ERROR;
  public readonly grpcCode: number = grpc.status.INTERNAL;

  get content(): string {
    return this.message;
  }
}

export class NotFoundError extends MicroChassisError {
  public readonly status = httpStatus.NOT_FOUND;
  public readonly grpcCode = grpc.status.NOT_FOUND;
}

export class ValidationError extends MicroChassisError {
  public readonly status = httpStatus.BAD_REQUEST;
  public readonly grpcCode = grpc.status.FAILED_PRECONDITION;
}

export class UnauthorizedError extends MicroChassisError {
  public readonly status = httpStatus.UNAUTHORIZED;
  public readonly grpcCode = grpc.status.UNAUTHENTICATED;
}

export class ForbiddenError extends MicroChassisError {
  public readonly status = httpStatus.FORBIDDEN;
  public readonly grpcCode = grpc.status.UNAUTHENTICATED;
}
