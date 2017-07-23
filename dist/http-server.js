var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { injectable } from 'inversify';
import * as express from 'express';
import * as httpStatus from 'http-status';
import { Config } from './config';
import { Logger } from './logger';
import { deepSet } from './utils';
let HttpServer = class HttpServer {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.server = express();
    }
    // Register an endpoint with the server
    registerService(service) {
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
        this.server[method](service.url, (request, response) => {
            this.handleRequest(service, request, response);
        });
    }
    // Starts the http server
    start() {
        this.server.listen(this.config.httpPort, () => {
            this.logger.info(`Http server starting listening on: ${this.config.httpPort}`);
        });
    }
    handleRequest(service, request, response) {
        const startTime = new Date();
        this.logger.info(`Http request started`);
        // Build up context object
        const context = {
            token: undefined,
            requestId: request.headers['x-request-id']
        };
        // Services are always authenticated unless explicitly set to unauthenticated
        if (service.unauthenticated === undefined || service.unauthenticated !== true) {
            let token = 'unauthorized';
            const tokenHeader = request.headers['authorization'];
            if (!service.unauthenticated && tokenHeader && tokenHeader.indexOf('Token') > -1) {
                context.token = request.headers['authorization'].split('Token')[1].trim();
            }
            else {
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
            }
            else {
                response.status(httpStatus.OK).send(data);
            }
            this.logger.info(`Http request ended, duration: ${new Date().getTime() - startTime.getTime()}ms`);
        });
    }
};
HttpServer = __decorate([
    injectable(),
    __metadata("design:paramtypes", [Config, Logger])
], HttpServer);
export { HttpServer };
//# sourceMappingURL=http-server.js.map