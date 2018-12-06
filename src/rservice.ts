import { Container, interfaces } from 'inversify';
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
  managers?: Array<{ new(...args: any[]): any }>;
  services: Array<{ new(...args: any[]): Service }>;
  providers?: Array<{ new(...args: any[]): any }>;
  proto?: ProtoConfig;
  config?: Array<ConfigOption>;
  events?: {
    subscribers?: Array<{ new(...args: any[]): Subscriber }>;
  }
}

export class RService {
  private container: Container;
  private httpServer?: HttpServer;
  private grpcServer?: GrpcServer;

  constructor(private serviceConfig: ServiceOptions) {
    this.container = new Container();

    this.container.bind('configoptions').toConstantValue(serviceConfig.config || []);
    this.container.bind<Config>(Config).toSelf().inSingletonScope();
    this.container.bind<HealthManager>(HealthManager).toSelf().inSingletonScope();
    this.container.bind<Logger>(Logger).toSelf();
    this.container.bind('express').toConstantValue(express);

    // Prepare the event emitter
    const subscribers = this.prepareEventSubscribers();
    this.container.bind('event-subscribers').toConstantValue(subscribers);
    this.container.bind<EventEmitter>(EventEmitter).toSelf().inSingletonScope();

    // Prepare for DI
    this.registerSingletons(this.serviceConfig.providers || []);
    this.registerSingletons(this.serviceConfig.managers || []);
    this.registerFactories(this.serviceConfig.services);

    const config = this.container.get(Config);

    // FIXME: make both server implementations injectable/configurable
    if (config.get('disableHTTP') !== true) {
      this.container.bind<HttpServer>(HttpServer).toSelf();
      this.httpServer = this.container.get(HttpServer);
    }

    if (config.get('disableGRPC') !== true) {
      if (!serviceConfig.proto) {
        throw new Error('GRPC server is enabled but no protoConfig was given');
      }

      this.container.bind('protoconfig').toConstantValue(serviceConfig.proto);
      this.container.bind<GrpcServer>(GrpcServer).toSelf();
      this.grpcServer = this.container.get(GrpcServer);
    }

    // Register services
    this.registerServices();

    // Done initializing
    if (this.httpServer) {
      this.httpServer.start();
    }

    if (this.grpcServer) {
      this.grpcServer.start();
    }

    if (!this.httpServer && !this.grpcServer) {
      throw new Error('Both HTTP and GRPC server are disabled');
    }
  }

  // Create services and register them with the grpc and http server
  private registerServices() {
    for (const serviceClass of this.serviceConfig.services) {
      const factory = this.container
        .get<interfaces.Factory<Service>>(composeFactoryBindName(serviceClass));

      if (this.httpServer) {
        this.httpServer.registerService(factory);
      }

      if (this.grpcServer) {
        this.grpcServer.registerService(factory);
      }
    }
  }

  private prepareEventSubscribers() {
    const subscribers: Array<Subscriber> = [];

    if (this.serviceConfig.events && this.serviceConfig.events.subscribers) {
      for (const subscriber of this.serviceConfig.events.subscribers) {
        this.container
          .bind<any>(<any>subscriber)
          .toSelf()
          .inSingletonScope();
        subscribers.push(<Subscriber>this.container.get(subscriber));
      }
    }

    return subscribers;
  }

  private registerSingletons<T>(items: Array<{ new(...args: any[]): T }>) {
    for (const itemClass of items) {
      this.container
        .bind<T>(itemClass)
        .toSelf()
        .inSingletonScope();
    }
  }

  private registerFactories<T>(items: Array<{ new(...args: any[]): T }>) {
    for (const itemClass of items) {
      // Binds both the class in question *and* its factory to
      // preserve backwards compatbility however doesn't set the scope
      // to "singleton"
      this.container
        .bind<T>(itemClass)
        .toSelf();
      this.container
        .bind<interfaces.Factory<T>>(composeFactoryBindName(itemClass))
        .toAutoFactory<T>(itemClass);
    }
  }
}

function composeFactoryBindName(cls: { name: string }): string {
  return `Factory<${cls.name}>`;
}
