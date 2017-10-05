import { Container, injectable } from 'inversify';
import * as grpc from 'grpc';
import * as express from 'express';

import { Config, ConfigOption } from './config';
import { Logger } from './logger';
import { HealthManager } from './health';
import { Service } from './service';
import { HttpServer } from './http-server';
import { GrpcServer } from './grpc-server';
import { ProtoConfig } from './proto-config';
import { EventEmitter, Subscriber } from './events';

export interface ServiceOptions {
  managers?: Array<{ new(...any): any }>;
  services: Array<{ new(...any): Service }>;
  providers?: Array<{ new(...any): any }>;
  proto: ProtoConfig;
  config?: Array<ConfigOption>;
  events?: {
    subscribers?: Array<{ new(...any): Subscriber }>;
  }
}

export class RService {
  private container = new Container();
  private httpServer: HttpServer;
  private grpcServer: GrpcServer;

  constructor(private serviceConfig: ServiceOptions) {
    this.container.bind('configoptions').toConstantValue(serviceConfig.config);
    this.container.bind<Config>(Config).toSelf().inSingletonScope();
    this.container.bind<HealthManager>(HealthManager).toSelf().inSingletonScope();
    this.container.bind<Logger>(Logger).toSelf();
    this.container.bind<HttpServer>(HttpServer).toSelf();
    this.container.bind<GrpcServer>(GrpcServer).toSelf();
    this.container.bind('grpc').toConstantValue(grpc);
    this.container.bind('express').toConstantValue(express);
    this.container.bind('protoconfig').toConstantValue(serviceConfig.proto);

    // Prepare the event emitter
    const subscribers = this.prepareEventSubscribers();
    this.container.bind('event-subscribers').toConstantValue(subscribers);

    this.container.bind<EventEmitter>(EventEmitter).toSelf().inSingletonScope();

    // Prepare the providers and managers for DI
    this.prepareProviders();
    this.prepareManagers();

    // Get server instances
    this.httpServer = this.container.get(HttpServer);
    this.grpcServer = this.container.get(GrpcServer);

    // Register services
    this.registerServices();

    // Done initializing
    this.httpServer.start();
    this.grpcServer.start();
  }

  // Makes providers available for dependency injection
  private prepareProviders() {
    if (this.serviceConfig.providers) {
      for (const providerName in this.serviceConfig.providers) {
        if (this.serviceConfig.providers.hasOwnProperty(providerName)) {
          const providerClass = this.serviceConfig.providers[providerName];
          this.container.bind<any>(providerClass).toSelf().inSingletonScope();
        }
      }
    }
  }

  // Makes managers available for dependency injection
  private prepareManagers() {
    if (this.serviceConfig.managers) {
      for (const managerName in this.serviceConfig.managers) {
        if (this.serviceConfig.managers.hasOwnProperty(managerName)) {
          const managerClass = this.serviceConfig.managers[managerName];
          this.container.bind<any>(managerClass).toSelf().inSingletonScope();
        }
      }
    }
  }

  // Create services and register them with the grpc and http server
  private registerServices() {
    if (this.serviceConfig.services) {
      for (const serviceName in this.serviceConfig.services) {
        if (this.serviceConfig.services.hasOwnProperty(serviceName)) {
          const serviceClass = this.serviceConfig.services[serviceName];

          this.container.bind<any>(<any>serviceClass).toSelf().inSingletonScope();
          const serviceInstance = <Service>this.container.get(<any>serviceClass);

          this.httpServer.registerService(serviceInstance);
          this.grpcServer.registerService(serviceInstance);
        }
      }
    }
  }

  private prepareEventSubscribers() {
    const subscribers: Array<Subscriber> = [];

    if (this.serviceConfig.events && this.serviceConfig.events.subscribers) {
      for (const subscriber of this.serviceConfig.events.subscribers) {
        this.container.bind<any>(<any>subscriber).toSelf().inSingletonScope();
        subscribers.push(<Subscriber>this.container.get(<any>subscriber));
      }
    }

    return subscribers;
  }
}
