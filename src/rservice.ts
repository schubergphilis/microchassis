import { Container, injectable } from 'inversify';

export interface ServiceConfig {
  managers?: any;
  services?: any;
  proto: any;
}

import { Config } from './config';
import { Logger } from './logger';
import { HealthManager } from './health';
import { Service } from './service';
import { HttpServer } from './http-server';
import { GrpcServer } from './grpc-server';

export class RService {
  private container = new Container();

  constructor(config: ServiceConfig) {
    // Make available for injection
    this.container.bind<Config>(Config).toSelf().inSingletonScope();
    this.container.bind<HealthManager>(HealthManager).toSelf().inSingletonScope();
    this.container.bind<Logger>(Logger).toSelf();
    this.container.bind<HttpServer>(HttpServer).toSelf();
    this.container.bind<GrpcServer>(GrpcServer).toSelf();


    // Make managers available for injection
    if (config.managers) {
      for (const managerName in config.managers) {
        const managerClass = config.managers[managerName];
        this.container.bind<any>(managerClass).toSelf().inSingletonScope();
      }
    }

    // Create services and register them with the grpc and http server
    if (config.services) {

      // Get server instances
      const httpServer = this.container.get(HttpServer);
      const grpcServer = this.container.get(GrpcServer);

      grpcServer.loadProto(config.proto);

      // Now start registering the services
      for (const serviceName in config.services) {
        const serviceClass = config.services[serviceName];

        // injectable()(serviceClass);

        this.container.bind<any>(<any>serviceClass).toSelf().inSingletonScope;
        const serviceInstance = <Service>this.container.get(<any>serviceClass);

        httpServer.registerService(serviceInstance);
        grpcServer.registerService(serviceInstance);
      }

      httpServer.start();
      grpcServer.start();
    }
  }
}