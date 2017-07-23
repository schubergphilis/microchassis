export declare type LogLevel = 'info' | 'warn' | 'error' | 'debug';
export interface Config {
    httpPort: number;
    grpcPort: number;
    logLevel: LogLevel;
}
export declare class Config implements Config {
    httpPort: number;
    grpcPort: number;
    logLevel: LogLevel;
}
