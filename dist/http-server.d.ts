import { Config } from './config';
import { Service } from './service';
import { Logger } from './logger';
export declare class HttpServer {
    private config;
    private logger;
    private server;
    constructor(config: Config, logger: Logger);
    registerService(service: Service): void;
    start(): void;
    private handleRequest(service, request, response);
}
