import { injectable } from 'inversify';

import { HttpMethod, Context, Service, ServiceCallback } from './../../src';
import { HelloRequest } from './../proto/hello';
import { HelloManager } from './../managers';

@injectable()
export class HelloService implements Service {
  public url = '/hello';

  constructor(private manager: HelloManager) {}

  handler(context: Context, request: HelloRequest, callback: ServiceCallback) {
    callback(null, {
      message: this.manager.hello(request.name)
    });
  }
}