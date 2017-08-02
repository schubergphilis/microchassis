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
    const messages = [];

    if (args && args[0]) {
      args[0].forEach((arg: any) => {
        if (args instanceof Error) {
          console.error(args);
          messages.push(JSON.stringify(args, ['message', 'stack', 'name']));
        } else {
          messages.push(JSON.stringify(arg));
        }
      });
    }


    const message = {
      level,
      message: messages
    };

    console.log(JSON.stringify(message));
  }
}
