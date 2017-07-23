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
import * as grpc from 'grpc';
import { Config } from './config';
import { Logger } from './logger';
let GrpcServer = class GrpcServer {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.server = new grpc.Server();
        this.services = {};
    }
    loadProto(proto) {
        this.logger.info(`Loading proto at: ${proto}`);
        this.proto = grpc.load(proto);
    }
    registerService(service) {
        const serviceName = service.constructor.name.split('Service')[0];
        this.logger.debug(`Registering GRPC service: ${serviceName}`);
        this.services[serviceName] = (call, callback) => {
            this.logger.info(`GRPC request started ${serviceName}`);
            service.handler.apply(service, [{}, call, (error, result) => {
                    this.logger.info(`GRPC request ended ${serviceName}`);
                    callback(error, result);
                }]);
        };
    }
    start() {
        // @TODO TODO make this waaaaaaaaaay smarter.....
        const serviceKey = Object.keys(this.proto).find((key) => {
            return key.indexOf('Service') > -1;
        });
        this.server.addService(this.proto[serviceKey].service, this.services);
        this.server.bind(`0.0.0.0:${this.config.grpcPort}`, grpc.ServerCredentials.createInsecure());
        this.server.start();
        this.logger.info(`Grpc server started listening on: ${this.config.grpcPort}`);
    }
};
GrpcServer = __decorate([
    injectable(),
    __metadata("design:paramtypes", [Config, Logger])
], GrpcServer);
export { GrpcServer };
//# sourceMappingURL=grpc-server.js.map