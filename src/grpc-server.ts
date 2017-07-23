import { injectable } from 'inversify';
import * as grpc from 'grpc';

import { Config } from './config';
import { Logger } from './logger';
import { Service } from './service';

@injectable()
export class GrpcServer{
  private server = new grpc.Server();
  private services = {};
  private proto;

  constructor(private config: Config, private logger: Logger) {}

  public loadProto(proto) {
    this.logger.info(`Loading proto at: ${proto}`);
    this.proto = grpc.load(proto);
  }

  public registerService(service: Service) {
    const serviceName = service.constructor.name.split('Service')[0];

    this.logger.debug(`Registering GRPC service: ${serviceName}`);
    this.services[serviceName] = (call, callback) => {
      this.logger.info(`GRPC request started ${serviceName}`);

      service.handler.apply(service, [{}, call, (error, result) => {
        this.logger.info(`GRPC request ended ${serviceName}`);
        callback(error, result);
      }]);
    }
  }

  public start(): void {
    // @TODO TODO make this waaaaaaaaaay smarter.....
    const serviceKey = Object.keys(this.proto).find((key) => {
      return key.indexOf('Service') > -1;
    });

    this.server.addService(this.proto[serviceKey].service, this.services);
    this.server.bind(`0.0.0.0:${this.config.grpcPort}`, grpc.ServerCredentials.createInsecure());
    this.server.start();
    this.logger.info(`Grpc server started listening on: ${this.config.grpcPort}`);
  }
}