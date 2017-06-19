import { injectable } from 'inversify';
import { Config } from './config';

@injectable()
export class Logger {
  private logLevel: string;

  constructor(private config: Config) {
    this.logLevel = config.logLevel;
  }

  info(message: string) {
    console.log(`[info] ${message}`);
  }

  warn(message: string) {
    console.log(`[warn] ${message}`);
  }

  error(message: string) {
    console.log(`[error] ${message}`);
  }

  audit(message: string) {
    console.log(`[audit] ${message}`);
  }

  debug(message: string) {
    console.log(`[debug] ${message}`);
  }
}