import { injectable, inject } from 'inversify';
import { Request, Response, NextFunction } from 'express';
import * as bodyParser from 'body-parser';
import * as httpStatus from 'http-status';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { v4 as uuid } from 'uuid';
import * as timeout from 'connect-timeout';

import { HealthManager } from './health';
import { Config } from './config';
import { Service, ServiceResponse } from './service';
import { Logger } from './logger';
import { Context } from './context';
import { deepSet } from './utils';
import { HttpMethod } from './service';

export interface RegisteredServices {
  [key: string]: keyof typeof HttpMethod;
}

@injectable()
export class HttpServer {
  public health = new BehaviorSubject(false);
  protected registeredUrls: RegisteredServices = {};
  protected server;

  constructor( @inject('express') private express, private config: Config, private logger: Logger, healthManager: HealthManager) {
    healthManager.registerCheck('HTTP server', this.health);

    // Setup express and a json body parser
    this.server = express();
    this.server.use(bodyParser.json({
      type: (request) => {
        let contentType: string;

        if (request.headers && request.headers['content-type']) {
          if (Array.isArray(request.headers['content-type'])) {
            contentType = request.headers['content-type'][0] || '';
          } else {
            contentType = <string>request.headers['content-type'];
          }
        }

        return contentType.startsWith('application/json');
      }
    }));

    // Register health check endpoint
    const healthUrl = this.normalizeURL(this.config['healthCheckURL'] || '/check');

    this.server.get(healthUrl, (request: Request, response: Response) => {
      const report = healthManager.getReport();

      if (healthManager.healthy) {
        response.status(httpStatus.OK).send(report);
      } else {
        response.status(httpStatus.SERVICE_UNAVAILABLE).send(report);
      }
    });
  }

  // Register an endpoint with the server
  public registerService(service: Service) {
    // Normalize methodType to express method function
    const method: string = (service.method || 'GET').toLowerCase();
    const url = this.normalizeURL(service.url);

    if (this.registeredUrls[url] && this.registeredUrls[url] === service.method) {
      const error = `Trying to register url: ${url} with the same HttpMethod (${service.method}) twice`;
      this.logger.fatal(error);
      throw new Error(error);
    } else {
      this.logger.debug(`Registering HTTP handler: ${service.method || method} ${url}`);
      this.registeredUrls[url] = service.method;

      this.server[method](url, (request: Request, response: Response) => {
        this.handleRequest(service, request, response);
      });
    }
  }

  // Starts the http server
  public start() {
    // Set a 30 seconds request timeout
    const connectTimeout: number = this.config['connectTimeout'] || 30000;
    this.server.use(timeout(connectTimeout));

    // 404 middleware
    this.server.use((request: Request, response: Response, next: NextFunction) => {
      this.logger.warn(`Unknown endpoint called: ${request.url}`);

      response.status(httpStatus.NOT_FOUND).send({
        message: `Unknown endpoint: ${request.url}`
      });
    });

    // Error middleware
    this.server.use((error, request: Request, response: Response, next: NextFunction) => {
      this.logger.error(`Express error middleware error for ${request.url}`, error);
      console.error(error);

      response.status(httpStatus.INTERNAL_SERVER_ERROR).send({
        message: 'Something went terribly wrong....'
      });
    });

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
      response.status(httpStatus.FORBIDDEN).send('Unauthenticated');
      return;
    }

    let body = request.body || {};

    // See if we need to map query string or url parameters
    body = this.getQueryParams(service, request, body);
    body = this.getUrlParams(service, request, body);

    // Call the httpHandler
    service.handler(context, body)
      .then((serviceResponse: ServiceResponse) => {
        const status = serviceResponse.status || httpStatus.OK;
        const content = serviceResponse.content;

        response.status(status).send(content);

        const duration = new Date().getTime() - startTime.getTime();
        this.logger.info(`Http request '${request.url}' ended: ${status}, duration: ${duration}ms`, { context });
      })
      .catch((error: ServiceResponse = {}) => {
        this.logger.error(error.content);

        const status = error.status || httpStatus.INTERNAL_SERVER_ERROR;
        const content = error.content || 'Internal server error';

        response.status(status).send(content);

        const duration = new Date().getTime() - startTime.getTime();
        this.logger.info(`Http request '${request.url}' ended: ${status}, duration: ${duration}ms`, { context });
      });
  }

  private normalizeURL(url: string) {
    // Urls need to start with a slash
    if (url.charAt(0) !== '/') {
      url = `/${url}`;
    }

    // Check for root in config and prepend to the url
    if (this.config['httpRoot']) {
      let httpRoot = this.config['httpRoot'];

      // Should start with an slash
      if (httpRoot.charAt(0) !== '/') {
        httpRoot = `/${httpRoot}`;
      }

      // Should not end with an slash
      if (httpRoot.charAt(httpRoot.length - 1) === '/') {
        httpRoot = httpRoot.substring(0, httpRoot.length - 1);
      }

      url = `${httpRoot}${url}`;
    }

    return url;
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
    } else {
      requestId = uuid();
    }

    if (request.headers['remoteuser']) {
      user = request.headers['remoteuser'].toString();
    }

    return {
      token,
      requestId,
      user
    }
  }
}
