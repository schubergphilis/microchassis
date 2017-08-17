import { injectable } from 'inversify';
import { Context } from './context';
import { Config } from './config';
import * as util from 'util';

export enum LogLevel {
  DEBUG,
  INFO,
  WARN,
  ERROR,
  FATAL
}

export interface LogRecord {
  level: LogLevel;
  message: string;
  time: Date;
  formatArgs: Array<string>,
  extra: Object;
}

export interface ProcessorFunction {
  (message: LogRecord): LogRecord
}

export interface HandlerFunction {
  (message: LogRecord): void
}

function prepareRecord(level: LogLevel, message: string, args: Array<any>): LogRecord {
  const formatArgs: Array<string> = [];
  const extraArgs = {};
  for (const arg of args) {
    if (typeof arg === 'string') {
      formatArgs.push(arg);
    } else {
      Object.assign(extraArgs, arg);
    }
  }
  return {
    message: message,
    time: new Date(),
    extra: extraArgs,
    formatArgs: formatArgs,
    level: level
  };
}

function formatError(error: Error): any {
  // Alternative appraoch as suggested on SO:
  // return JSON.stringify(err, Object.getOwnPropertyNames(err));
  return { message: error.message, stack: error.stack, name: error.name };

}

function consoleHandler(record: LogRecord) {
  console.log(JSON.stringify({
    _time: record.time,
    level: LogLevel[record.level],
    message: util.format(record.message, ...record.formatArgs),
    extra: record.extra
  }))
}

@injectable()
export class Logger {
  private _debug: boolean = false;

  constructor(
    private config: Config,
    private processors: Array<ProcessorFunction> = [],
    private handlers: Array<HandlerFunction> = [consoleHandler],
    private logLevel: LogLevel = LogLevel.DEBUG
  ) {
    switch (config['logLevel']) {
      case 'debug': this.logLevel = LogLevel.DEBUG; break;
      case 'info': this.logLevel = LogLevel.INFO; break;
      case 'warn': this.logLevel = LogLevel.WARN; break;
      case 'error': this.logLevel = LogLevel.ERROR; break;
      case 'fatal': this.logLevel = LogLevel.FATAL; break;
    }
    if (this.handlers.length === 0) {
      throw TypeError("No handlers configured for logger");
    }
    if (config['debug'] === true || config['debug'] === 'true') {
      this._debug = true;
    }
  }

  public get level(): LogLevel { return this.logLevel }
  public set level(logLevel: LogLevel) { this.logLevel = logLevel }

  debug(message: string, ...args: any[]) {
    this.log(prepareRecord(LogLevel.DEBUG, message, args));
  }

  info(message: string, ...args: Array<any>) {
    this.log(prepareRecord(LogLevel.INFO, message, args));
  }

  warn(message: string, ...args: any[]) {
    this.log(prepareRecord(LogLevel.WARN, message, args));
  }

  error(message: string, ...args: any[]) {
    this.log(prepareRecord(LogLevel.ERROR, message, args));
  }

  exception(error: Error, message: string, ...args: any[]) {
    if (this._debug === true) {
      console.error(error);
    }
    args.push({ error: formatError(error) });
    this.log(prepareRecord(LogLevel.ERROR, message, args));
  }

  fatal(message: string, ...args: any[]) {
    this.log(prepareRecord(LogLevel.FATAL, message, args));
  }

  audit(message: string, ...args: any[]) {
    args.push({ audit: true });
    this.log(prepareRecord(LogLevel.INFO, message, args));
  }

  private log(record: LogRecord) {
    // Ignore messages below set logger level
    if (record.level < this.logLevel) {
      return;
    }
    for (const processor of this.processors) {
      record = processor(record);
    }
    for (const handler of this.handlers) {
      handler(record);
    }
  }
}
