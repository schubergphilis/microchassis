import { Container, injectable } from 'inversify';
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
    this.container.bind('configoptions').toConstantValue(serviceConfig.config || []);
    this.container.bind<Config>(Config).toSelf().inSingletonScope();
    this.container.bind<HealthManager>(HealthManager).toSelf().inSingletonScope();
    this.container.bind<Logger>(Logger).toSelf();
    this.container.bind<HttpServer>(HttpServer).toSelf();
    this.container.bind<GrpcServer>(GrpcServer).toSelf();
    this.container.bind('express').toConstantValue(express);
    this.container.bind('protoconfig').toConstantValue(serviceConfig.proto);

    // Prepare the event emitter
    const subscribers = this.prepareEventSubscribers();
    this.container.bind('event-subscribers').toConstantValue(subscribers);

    this.container.bind<EventEmitter>(EventEmitter).toSelf().inSingletonScope();

    // Prepare for DI
    this.registerSingletons(this.serviceConfig.providers);
    this.registerSingletons(this.serviceConfig.managers);
    this.registerSingletons(this.serviceConfig.services);

    // Get server instances
    this.httpServer = this.container.get(HttpServer);
    this.grpcServer = this.container.get(GrpcServer);

    // Register services
    this.registerServices();

    // Done initializing
    this.httpServer.start();
    this.grpcServer.start();
  }

  // Create services and register them with the grpc and http server
  private registerServices() {
    if (this.serviceConfig.services) {
      for (const serviceClass of this.serviceConfig.services) {
        const serviceInstance = <Service>this.container.get(<any>serviceClass);

        this.httpServer.registerService(serviceInstance);
        this.grpcServer.registerService(serviceInstance);
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

  private registerSingletons(items?: Array<{ new(...any): any }>) {
    if (items) {
      for (const itemClass of items) {
        this.container.bind<any>(<any>itemClass).toSelf().inSingletonScope();
      }
    }
  }
}
