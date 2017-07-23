import { Container } from 'inversify';
import { Config } from './config';
import { Logger } from './logger';
import { HealthManager } from './health';
import { HttpServer } from './http-server';
import { GrpcServer } from './grpc-server';
export class RService {
    constructor(serviceConfig, grpcPort, httpPort) {
        this.container = new Container();
        // Make available for injection
        this.container.bind(Config).toSelf().inSingletonScope();
        // Temporary override
        const config = this.container.get(Config);
        config.grpcPort = grpcPort;
        config.httpPort = httpPort;
        this.container.bind(HealthManager).toSelf().inSingletonScope();
        this.container.bind(Logger).toSelf();
        this.container.bind(HttpServer).toSelf();
        this.container.bind(GrpcServer).toSelf();
        // Make managers available for injection
        if (serviceConfig.managers) {
            for (const managerName in serviceConfig.managers) {
                const managerClass = serviceConfig.managers[managerName];
                this.container.bind(managerClass).toSelf().inSingletonScope();
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
                this.container.bind(serviceClass).toSelf().inSingletonScope;
                const serviceInstance = this.container.get(serviceClass);
                httpServer.registerService(serviceInstance);
                grpcServer.registerService(serviceInstance);
            }
            httpServer.start();
            grpcServer.start();
        }
    }
}
//# sourceMappingURL=rservice.js.map