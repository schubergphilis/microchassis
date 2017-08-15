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
        if (arg instanceof Error) {
          messages.push(JSON.stringify(arg, ['message', 'stack', 'name']));
        } else if (arg && arg.token) {
          // Prevent (accidental) logging of the token incase arg is a context object
          // making a copy here, object is passed by reference, deleting the token would have
          // side effects
          const context = Object.assign({}, arg)
          delete context['token'];
          messages.push(context);
        } else {
          messages.push(arg);
        }
      });
    }


    const message = {
      level,
      message: messages.length === 1 ? messages[0] : messages,
      timestamp: new Date()
    };

    console.log(JSON.stringify(message));
  }
}
