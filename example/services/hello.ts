import { injectable } from 'inversify';
import * as httpStatus from 'http-status';
import {
  ServiceResponse, HttpMethod, Context, Service,
  MicroChassisError, UnauthorizedError, ForbiddenError, NotFoundError, ValidationError
} from '../../src';

import { HelloRequest } from '../proto/hello';
import { HelloManager } from '../managers';
import { GRPCClient } from '../providers/grpc-client';

@injectable()
export class HelloService implements Service {
  public grpcMethod = 'Hello';
  public method: HttpMethod = 'GET';
  public url = '/hello';
  public unauthenticated = true;
  public queryMapping = { 'name': 'name' };

  constructor(
    private manager: HelloManager,
    private rpcClient: GRPCClient
  ) { }

  public async handler(context: Context, request: any): Promise<ServiceResponse> {
    return {
      status: 200,
      content: this.manager.hello(request.name)
    };
  }
}

@injectable()
export class IndirectHelloService implements Service {
  public grpcMethod = 'IndirectHello';
  public method: HttpMethod = 'GET';
  public url = '/hello2';
  public queryMapping = { 'name': 'name' };
  public unauthenticated = true;
  private manager = null;

  constructor(
    private rpcClient: GRPCClient
  ) { }

  public async handler(context: Context, request: any): Promise<ServiceResponse> {
    try {
      const response = await this.rpcClient.call('hello', context, { 'name': request.name });
      return {
        status: 200,
        content: response.message
      };
    } catch (error) {
      return { status: 500 };
    }
  }
}

@injectable()
export class RandomErrorService implements Service {

  private static errors: Error[] = [
    new Error('Unhandled error'),
    new MicroChassisError('Generic error'),
    new UnauthorizedError('Unauthorized'),
    new ForbiddenError('Forbidden'),
    new NotFoundError('Not found'),
    new ValidationError('Failed validation'),
  ];

  public grpcMethod = 'RandomError';
  public method: HttpMethod = 'GET';
  public url = '/random_error';
  public unauthenticated = true;
  private manager = null;

  constructor(
    private rpcClient: GRPCClient
  ) { }

  public async handler(context: Context, request: any): Promise<ServiceResponse> {
    const error = RandomErrorService.errors[Math.floor(Math.random() * RandomErrorService.errors.length)];
    throw error;
  }
}
