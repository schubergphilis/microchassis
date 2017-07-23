export interface ServiceConfig {
    managers?: any;
    services?: any;
    proto: any;
}
export declare class RService {
    private container;
    constructor(serviceConfig: ServiceConfig, grpcPort?: number, httpPort?: number);
}
