import { injectable, inject, interfaces } from 'inversify';

import { Request, Response, NextFunction, Express } from 'express';
import * as bodyParser from 'body-parser';
import * as httpStatus from 'http-status';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { v4 as uuid } from 'uuid';
import * as timeout from 'connect-timeout';

import { HealthManager } from './health';
import { Config } from './config';
import { HttpMethod, ServiceHandlerFunction, QueryMapping, UrlMapping } from './service';
import { Logger } from './logger';
import { Context } from './context';
import { deepSet } from './utils';
import { MicroChassisError } from './errors';

export interface RegisteredServices {
  [key: string]: HttpMethod;
}

export interface HttpService {
  url: string;
  method: HttpMethod;
  handler: ServiceHandlerFunction;
  unauthenticated?: boolean;
  queryMapping?: QueryMapping;
  urlMapping?: UrlMapping;
}

@injectable()
export class HttpServer {
  public health = new BehaviorSubject(false);
  protected registeredUrls: RegisteredServices = {};
  protected server: Express;

  constructor(
    @inject('express') private express: () => Express | Object,
    private config: Config,
    private logger: Logger,
    healthManager: HealthManager
  ) {
    healthManager.registerCheck('HTTP server', this.health);

    // Setup express and a json body parser
    this.server = <Express>(this.express());

    // Disable sending out the default x-powered-by header from express
    this.server.disable('x-powered-by');

    // Set the json body parser middleware
    this.server.use(bodyParser.json({
      type: (request) => {
        if (request.headers === undefined) {
          return false;
        }

        let contentType: string | string[] = request.headers['content-type'] || '';
        if (Array.isArray(contentType)) {
          contentType = contentType[0] || '';
        }

        return (<string>contentType).startsWith('application/json');
      }
    }));

    // Register health check endpoint
    const healthUrl = this.normalizeURL(this.config.get('healthCheckURL') || '/check');

    this.server.get(healthUrl, (_: Request, response: Response) => {
      const report = healthManager.getReport();

      if (healthManager.healthy) {
        response.status(httpStatus.OK).send(report);
      } else {
        response.status(httpStatus.SERVICE_UNAVAILABLE).send(report);
      }
    });
  }

  // Register an endpoint with the server
  public registerService(serviceFactory: interfaces.Factory<HttpService>) {
    // Creates a throw away service instance that is used for getting
    // all required information for express
    const service = <HttpService>serviceFactory();

    // Normalize methodType to express method function
    const method: string = (service.method || 'GET').toLowerCase();
    const url = this.normalizeURL(service.url);

    if (this.registeredUrls[url] && this.registeredUrls[url] === service.method) {
      const error = `Trying to register url: ${url} with the same HttpMethod (${service.method}) twice`;
      this.logger.fatal(error);
      throw new Error(error);
    }
    this.logger.info(`Registering HTTP handler: ${service.method || method} ${url}`);
    this.registeredUrls[url] = service.method;

    (this.server as any)[method](url, (request: Request, response: Response) => {
      return this.handleRequest(serviceFactory, request, response);
    });
  }

  // Starts the http server
  public start() {
    // Set a 30 seconds request timeout
    const connectTimeout: number = this.config.get('connectTimeout') || 30000;
    this.server.use(timeout(`${connectTimeout}ms`));

    // 404 middleware
    this.server.use((request: Request, response: Response, _: NextFunction) => {
      this.logger.warn(`Unknown endpoint called: ${request.url}`);

      response.status(httpStatus.NOT_FOUND).send({
        message: `Unknown endpoint: ${request.url}`
      });
    });

    // Error middleware
    this.server.use((error: any, request: Request, response: Response, _: NextFunction) => {
      this.logger.error(`Express error middleware error for ${request.url}`, error);
      console.error(error);

      response.status(httpStatus.INTERNAL_SERVER_ERROR).send({
        message: 'Something went terribly wrong....'
      });
    });

    this.server.listen(this.config.get('httpPort'), () => {
      this.logger.info(`Http server starting listening on: ${this.config.get('httpPort')} `);
      this.health.next(true);
    });
  }

  private async handleRequest(serviceFactory: interfaces.Factory<HttpService>, request: Request, response: Response): Promise<void> {
    // Build up context object
    const context = this.createContext(request);

    const startTime = new Date();
    this.logger.info(`Http request: '${request.url}' started`, context);

    const service = <HttpService>serviceFactory();

    if (!service.unauthenticated && !context.token) {
      this.logger.audit(`Unauthenticated request on: ${service.url} `);
      response.status(httpStatus.FORBIDDEN).send('Unauthenticated');
      return;
    }

    let body = request.body || {};

    // See if we need to map query string or url parameters
    body = this.getQueryParams(service, request, body);
    body = this.getUrlParams(service, request, body);

    // Set default status to 500 in an attempt to be defensive
    let content = 'Internal server error';
    let status: number = httpStatus.INTERNAL_SERVER_ERROR;

    // Call the httpHandler
    try {
      const serviceResponse = await service.handler(context, body);
      if (!serviceResponse) {
        throw new Error('Response is void, aborting');
      } else if (serviceResponse instanceof MicroChassisError) {
        throw serviceResponse;
      }

      status = serviceResponse.status || httpStatus.OK;
      content = serviceResponse.content;
      if (serviceResponse.headers) {
        response.set(serviceResponse.headers);
      }
    } catch (error) {
      if (error instanceof MicroChassisError) {
        status = error.status || status;
        content = error.content || content;
      } else if (error instanceof Error) {
        content = error.message;
      }

      this.logger.error(content);
    }

    response.status(status).send(content);

    const duration = new Date().getTime() - startTime.getTime();
    const extra = {
      url: request.url,
      context,
      duration,
      status,
      httpMethod: service.method,
      uri: service.url,
      transport: 'HTTP'
    };
    this.logger.info(`HTTP request '${request.url}' ended: ${status}, duration: ${duration} ms`, extra);
  }

  private normalizeURL(url: string) {
    // Urls need to start with a slash
    if (url.charAt(0) !== '/') {
      url = `/${url}`;
    }

    // Check for root in config and prepend to the url
    if (this.config.get('httpRoot')) {
      let httpRoot = this.config.get('httpRoot');

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

  private getQueryParams(service: HttpService, request: Request, body: any): any {
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

  private getUrlParams(service: HttpService, request: Request, body: any): any {
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
      token = (request.headers['authorization'] || '').toString().split('Token ')[1];
    }

    if (request.headers['x-request-id']) {
      requestId = (request.headers['x-request-id'] || '').toString();
    } else {
      requestId = uuid();
    }

    if (request.headers['remoteuser']) {
      user = (request.headers['remoteuser'] || '').toString();
    }

    return {
      token: <string>token,
      requestId: requestId,
      user: <string>user
    }
  }
}
