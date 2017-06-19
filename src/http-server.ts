import { injectable } from 'inversify';
import * as express from 'express';
import { Request, Response } from 'express';
import * as httpStatus from 'http-status';

import { Config } from './config';
import { Service } from './service';
import { Logger} from './logger';
import { Context } from './context';
import { deepSet} from './utils';

@injectable()
export class HttpServer {
  private server;

  constructor(private config: Config, private logger: Logger) {
    this.server = express();
  }

  // Register an endpoint with the server
  public registerService(service: Service) {
    const serviceName = service.constructor.name.split('Service')[0];    

    // Normalize methodType to express method function
    let method = 'get';

    if (service.method) {
      method = service.method.toLowerCase();
    }

    // Urls need to start with a slash
    let url = service.url;

    if (url.charAt(0) !== '/') {
      url = `/${url}`;
    }

    this.logger.debug(`Registering HTTP handler: ${service.method || method} ${url}`);
    
    this.server[method](service.url, (request: Request, response: Response) => {
      this.handleRequest(service, request, response);
    });
  }

  // Starts the http server
  public start() {
    this.server.listen(this.config.httpPort, () => {
      this.logger.info(`Http server starting listening on: ${this.config.httpPort}`);
    });
  }

  private handleRequest(service: Service, request: Request, response: Response) {
    const startTime = new Date();
    this.logger.info(`Http request started`);

    // Build up context object
    const context: Context = {
      token: undefined,
      requestId: request.headers['x-request-id']
    }

    // Services are always authenticated unless explicitly set to unauthenticated
    if (service.unauthenticated === undefined || service.unauthenticated !== true) {
      let token = 'unauthorized';
      const tokenHeader = request.headers['authorization'];

      if (!service.unauthenticated && tokenHeader && tokenHeader.indexOf('Token') > -1) {
        context.token = request.headers['authorization'].split('Token')[1].trim()
      } else {
        response.status(httpStatus.BAD_REQUEST).send({
          message: 'Invalid token'
        });
        return;
      }
    }
    
    let body = request.body || {};

    // See if we need to map query string parameters
    if (service.queryMapping) {

      // Handle each query string parameter
      for (let param in service.queryMapping) {
        const value = request.query[param];
        const path = service.queryMapping[param];
        
        if (value) {
          deepSet(body, path, value);
        }
      }
    }

    // See if we need to map url parameters
    if (service.urlMapping) {
      for (let param in service.urlMapping) {
        const value = request.params[param];
        const path = service.urlMapping[param];

        if (value) {
          deepSet(body, path, value);
        }
      }
    }

    // Call the httpHandler
    service.handler(context, body, (error, data) => {
      if (error) {
        // TODO: map this to proper errors
        response.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
        response.send();
      } else {
        response.status(httpStatus.OK).send(data);
      }

      this.logger.info(`Http request ended, duration: ${new Date().getTime() - startTime.getTime()}ms`);
    });
  }
}