import { injectable } from 'inversify';

import { HttpMethod, Context, Service, ServiceCallback } from './../../src';
import { HelloRequest } from './../proto/hello';

@injectable()
export class HelloService implements Service {
  public url = '/hello';

  handler(context: Context, request: HelloRequest, callback: ServiceCallback) {
    callback(null, {
      message: 'Hello World'
    });
  }
}