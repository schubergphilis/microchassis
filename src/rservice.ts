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

  constructor(serviceConfig: ServiceConfig, grpcPort?: number, httpPort?: number) {

    // Make available for injection
    this.container.bind<Config>(Config).toSelf().inSingletonScope();

    // Temporary override
    const config = this.container.get(Config);
    config.grpcPort = grpcPort;
    config.httpPort = httpPort;

    this.container.bind<HealthManager>(HealthManager).toSelf().inSingletonScope();
    this.container.bind<Logger>(Logger).toSelf();
    this.container.bind<HttpServer>(HttpServer).toSelf();
    this.container.bind<GrpcServer>(GrpcServer).toSelf();


    // Make managers available for injection
    if (serviceConfig.managers) {
      for (const managerName in serviceConfig.managers) {
        const managerClass = serviceConfig.managers[managerName];
        this.container.bind<any>(managerClass).toSelf().inSingletonScope();
      }
    }

    // Create services and register them with the grpc and http server
    if (serviceConfig.services) {

      // Get server instances
      const httpServer = this.container.get(HttpServer);
      const grpcServer = this.container.get(GrpcServer);

      grpcServer.loadProto(serviceConfig.proto);

      // Now start registering the services
      for (const serviceName in serviceConfig.services) {
        const serviceClass = serviceConfig.services[serviceName];

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