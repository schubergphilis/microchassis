import { injectable } from 'inversify';
import { Context } from './context';
import { Config, LogLevel } from './config';

@injectable()
export class Logger {
  private logLevel: string;

  constructor(private config: Config) {
    this.logLevel = config['logLevel'];
  }

  info(...args: any[]) {
    this.log('info', args);
  }

  warn(...args: any[]) {
    this.log('warn', args);
  }

  error(...args: any[]) {
    this.log('error', args);
  }

  audit(...args: any[]) {
    this.log('audit', args);
  }

  debug(...args: any[]) {
    this.log('debug', args);
  }

  private log(level: string, ...args: any[]) {
    const message = {
      level,
      message: args[0]
    };

    console.log(JSON.stringify(message));
  }
}
