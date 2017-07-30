import { injectable, inject } from 'inversify';
import { Request, Response } from 'express';
import * as httpStatus from 'http-status';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { HealthManager } from './health';
import { Config } from './config';
import { Service } from './service';
import { Logger} from './logger';
import { Context } from './context';
import { deepSet} from './utils';

@injectable()
export class HttpServer {
  private server;
  public health = new BehaviorSubject(false);

  constructor(@inject('express') private express, private config: Config, private logger: Logger, healthManager: HealthManager) {
    this.server = express();
    healthManager.registerCheck('HTTP server', this.health);

    // Register health check endpoint
    this.server.get('/health', (request: Request, response: Response) => {
      if (healthManager.healthy) {
        response.status(200).send('Healthy');
      } else {
        response.status(503).send('Unhealthy');
      }
    });
  }

  // Register an endpoint with the server
  public registerService(service: Service) {
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
    
    this.server[method](url, (request: Request, response: Response) => {
      this.handleRequest(service, request, response);
    });
  }

  // Starts the http server
  public start() {
    this.server.listen(this.config.httpPort, () => {
      this.logger.info(`Http server starting listening on: ${this.config.httpPort}`);
      this.health.next(true);
    });
  }

  private handleRequest(service: Service, request: Request, response: Response) {
    const startTime = new Date();
    this.logger.info(`Http request started`);

    // Build up context object
    const context = this.createContext(request);

    if (!service.unauthenticated && !context.token) {
      this.logger.audit(`Unauthenticated request on: ${service.url}`);
      response.status(403).send('Unauthenticated');
      return;
    }
 
    let body = request.body || {};

    // See if we need to map query string or url parameters
    body = this.getQueryParams(service, request, body);
    body = this.getUrlParams(service, request, body);
    
    // Call the httpHandler
    service.handler(context, body, (error, data) => {
      if (error) {
        // TODO: map this to proper errors
        response.status(httpStatus.INTERNAL_SERVER_ERROR).send('Internal server error');
      } else {
        // TODO: probably want the service to be able to set this somehow
        response.status(httpStatus.OK).send(data);
      }

      this.logger.info(`Http request ended, duration: ${new Date().getTime() - startTime.getTime()}ms`);
    });
  }

  private getQueryParams(service: Service, request: Request, body: any): any {
    if (service.queryMapping) {
      for (let param in service.queryMapping) {
        const value = request.query[param];
        const path = service.queryMapping[param];
        
        if (value) {
          deepSet(body, path, value);
        }
      }
    }

    return body;
  }

  private getUrlParams(service: Service, request: Request, body: any): any {
    if (service.urlMapping) {
      for (let param in service.urlMapping) {
        const value = request.params[param];
        const path = service.urlMapping[param];

        if (value) {
          deepSet(body, path, value);
        }
      }
    }

    return body;
  }

  private createContext(request: Request): Context {
    let token;
    let requestId;

    if (request.headers['authorization']) {
      token = request.headers['authorization'].toString().split('Token ')[1];
    }

    if (request.headers['x-request-id']) {
      requestId = request.headers['x-request-id'].toString();
    }

    return {
      token,
      requestId
    }
  }
}