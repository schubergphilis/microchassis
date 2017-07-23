import { Config } from './config';
import { Logger } from './logger';
import { Service } from './service';
export declare class GrpcServer {
    private config;
    private logger;
    private server;
    private services;
    private proto;
    constructor(config: Config, logger: Logger);
    loadProto(proto: any): void;
    registerService(service: Service): void;
    start(): void;
}
