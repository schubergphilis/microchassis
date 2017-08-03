import { injectable, inject } from 'inversify';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { Context } from './context';
import { Config } from './config';
import { Logger } from './logger';
import { Service, ServiceResponse } from './service';
import { HealthManager } from './health';
import { ProtoConfig } from './proto-config';

@injectable()
export class GrpcServer {
  private server;
  private services = {};
  private proto;
  private health = new BehaviorSubject(false);

  constructor(@inject('grpc') private grpc,
              @inject('protoconfig') private protoConfig: ProtoConfig,
              private config: Config,
              private logger: Logger,
              private healthManager: HealthManager) {

    healthManager.registerCheck('GRPC server', this.health);

    this.server = new grpc.Server();
    this.proto = this.grpc.load(this.protoConfig.path);
  }

  public registerService(service: Service) {
    const serviceName = service.constructor.name.split('Service')[0];

    this.logger.debug(`Registering GRPC service: ${serviceName}`);

    // Setup handler
    this.services[serviceName] = (call, callback) => {
      this.logger.info(`GRPC request started ${serviceName}`);

      const context = this.createContext(call.metadata);

      service.handler.apply(service, [context, call])
        .then((response: ServiceResponse ) => {
          callback(null, response.content);
        })
        .catch((response: ServiceResponse) => {
          this.logger.error(response.content);

          // TODO: do some proper error mapping here
          callback(response.content, null);
        });
    }
  }

  public start(): void {
    const service = this.getGrpcService();

    this.server.addService(service, this.services);
    this.server.bind(`0.0.0.0:${this.config['grpcPort']}`, this.grpc.ServerCredentials.createInsecure());
    this.server.start();
    this.logger.info(`Grpc server started listening on: ${this.config['grpcPort']}`);

    // Notify the server is healhty
    this.health.next(true);
  }

  private getGrpcService() {
    let service;

    if (this.protoConfig.package) {
      service = this.proto[this.protoConfig.package][this.protoConfig.service].service;
    } else {
      service = this.proto[this.protoConfig.service].service;
    }

    return service;
  }

  private createContext(metadata): Context {
    return {
      token: metadata.get('authorization')[0].split('Token ')[1],
      requestId: metadata.get('request-id')[0],
      user: metadata.get('remoteuser')[0]
    }
  }
}
