import { injectable } from 'inversify';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface Config {
  httpPort: number;
  grpcPort: number;
  logLevel: LogLevel;
};

@injectable()
export class Config implements Config {
  public httpPort = 8000;
  public grpcPort = 9000;
  public logLevel: LogLevel = 'info';
}

