import { injectable, inject } from 'inversify';
import { Request, Response } from 'express';
import * as bodyParser from 'body-parser';
import * as httpStatus from 'http-status';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { HealthManager } from './health';
import { Config } from './config';
import { Service, ServiceResponse } from './service';
import { Logger} from './logger';
import { Context } from './context';
import { deepSet} from './utils';

@injectable()
export class HttpServer {
  private server;
  public health = new BehaviorSubject(false);

  constructor(@inject('express') private express, private config: Config, private logger: Logger, healthManager: HealthManager) {
    healthManager.registerCheck('HTTP server', this.health);

    // Setup express and a json body parser
    this.server = express();
    this.server.use(bodyParser.json());

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
    this.server.listen(this.config['httpPort'], () => {
      this.logger.info(`Http server starting listening on: ${this.config['httpPort']}`);
      this.health.next(true);
    });
  }

  private handleRequest(service: Service, request: Request, response: Response) {
    // Build up context object
    const context = this.createContext(request);

    const startTime = new Date();
    this.logger.info(`Http request: '${request.url}' started`, context);


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
    service.handler(context, body)
      .then((serviceResponse: ServiceResponse) => {
        this.logger.info(`Http request '${request.url}' ended, duration: ${new Date().getTime() - startTime.getTime()}ms`);

        const status = serviceResponse.status || httpStatus.OK;
        const content = serviceResponse.content;

        response.status(serviceResponse.status || httpStatus.OK).send(serviceResponse.content);
      })
      .catch((error: ServiceResponse = {}) => {
        this.logger.error(JSON.stringify(error));

        const status = error.status || httpStatus.INTERNAL_SERVER_ERROR;
        const content = error.content || 'Internal server error';

        response.status(status).send(content);
      });
  }

  private getQueryParams(service: Service, request: Request, body: any): any {
    if (service.queryMapping) {
      for (const param in service.queryMapping) {
        if (service.queryMapping.hasOwnProperty(param)) {
          const value = request.query[param];
          const path = service.queryMapping[param];

          if (value) {
            deepSet(body, path, value);
          }
        }
      }
    }

    return body;
  }

  private getUrlParams(service: Service, request: Request, body: any): any {
    if (service.urlMapping) {
      for (const param in service.urlMapping) {
        if (service.urlMapping.hasOwnProperty(param)) {
          const value = request.params[param];
          const path = service.urlMapping[param];

          if (value) {
            deepSet(body, path, value);
          }
        }
      }
    }

    return body;
  }

  private createContext(request: Request): Context {
    let token;
    let requestId;
    let user;

    if (request.headers['authorization']) {
      token = request.headers['authorization'].toString().split('Token ')[1];
    }

    if (request.headers['x-request-id']) {
      requestId = request.headers['x-request-id'].toString();
    }

    if (request.headers['remoteuser']) {
      user = request.header['remoteuser'].toString();
    }

    return {
      token,
      requestId,
      user
    }
  }
}
