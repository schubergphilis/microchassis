import { Config } from './config';
export declare class Logger {
    private config;
    private logLevel;
    constructor(config: Config);
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
    audit(message: string): void;
    debug(message: string): void;
}
