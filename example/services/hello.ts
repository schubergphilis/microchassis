import { injectable } from 'inversify';
import * as httpStatus from 'http-status';

import { ServiceResponse, HttpMethod, Context, Service } from './../../src';
import { HelloRequest } from './../proto/hello';
import { HelloManager } from './../managers';
import { GRPCClient } from './../providers/grpc-client';

@injectable()
export class HelloService implements Service {
  public method = HttpMethod.GET;
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
  public method = HttpMethod.GET;
  public url = '/hello2';
  public unauthenticated = true;
  private manager = null;

  constructor(
    private rpcClient: GRPCClient
  ) { }

  public async handler(context: Context, request: any): Promise<ServiceResponse> {
    try {
      const response = await this.rpcClient.call('hello', context, { name: "foo" });
      return {
        status: 200,
        content: response
      };
    } catch (error) {
      return { status: 500 };
    }
  }
}
