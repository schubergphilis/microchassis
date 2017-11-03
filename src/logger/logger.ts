import { injectable } from 'inversify';
import { Config } from './../config';

import {
  assignInstanceId,
  assignRequestId,
  assignSessionHash,
  assignVersion,
  removeSensitiveInfo
} from './processors';
import { consoleHandler } from './handlers';

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

export type LogProcessor = (message: LogRecord) => LogRecord;
export type ProcessorFunction = (config: Config) => LogProcessor;
export type LogHandler = (message: LogRecord) => void;
export type HandlerFunction = (config: Config) => LogHandler;

export interface LoggerOptions {
  processors?: Array<ProcessorFunction>;
  handlers?: Array<HandlerFunction>;
}


@injectable()
export class Logger {
  private _debug = false;
  private logLevel: LogLevel;

  // Note that order of calls is important here, so please make sure
  // that processors that are *removing* properties from log record
  // are run last, otherwise you might have a nasty conflict
  private defaultProcessors: Array<ProcessorFunction> = [
    assignInstanceId,
    assignRequestId,
    assignSessionHash,
    assignVersion,
    removeSensitiveInfo
  ];

  private defaultHandlers: Array<HandlerFunction> = [
    consoleHandler
  ];

  private processors: Array<LogProcessor> = [];
  private handlers: Array<LogHandler> = [];

  constructor(private config: Config) {
    switch (config['logLevel'] || LogLevel.DEBUG) {
      case 'debug': this.logLevel = LogLevel.DEBUG; break;
      case 'info': this.logLevel = LogLevel.INFO; break;
      case 'warn': this.logLevel = LogLevel.WARN; break;
      case 'error': this.logLevel = LogLevel.ERROR; break;
      case 'fatal': this.logLevel = LogLevel.FATAL; break;
    }

    if (config['debug'] === true || config['debug'] === 'true') {
      this._debug = true;
    }

    const loggerOptions: LoggerOptions = this.config['loggerOptions']
    const processors = loggerOptions && loggerOptions.processors ? loggerOptions.processors : this.defaultProcessors;
    const handlers = loggerOptions && loggerOptions.handlers ? loggerOptions.handlers : this.defaultHandlers;

    // Inject config into processors
    processors.map((processor: ProcessorFunction) => {
      this.processors.push(processor(this.config));
    });

    // Assign handlers
    handlers.map((handler: HandlerFunction) => {
      this.handlers.push(handler(this.config));
    });

    if (this.handlers.length === 0) {
      throw TypeError('No handlers configured for logger');
    }
  }

  public get level(): LogLevel { return this.logLevel }
  public set level(logLevel: LogLevel) { this.logLevel = logLevel }

  public debug(message: string, ...args: any[]) {
    this.log(this.prepareRecord(LogLevel.DEBUG, message, args));
  }

  public info(message: string, ...args: Array<any>) {
    this.log(this.prepareRecord(LogLevel.INFO, message, args));
  }

  public warn(message: string, ...args: any[]) {
    this.log(this.prepareRecord(LogLevel.WARN, message, args));
  }

  public error(message: string, ...args: any[]) {
    this.log(this.prepareRecord(LogLevel.ERROR, message, args));
  }

  public exception(error: Error, message: string, ...args: any[]) {
    if (this._debug === true) {
      console.error(error);
    }
    args.push({ error: this.formatError(error) });
    this.log(this.prepareRecord(LogLevel.ERROR, message, args));
  }

  public fatal(message: string, ...args: any[]) {
    this.log(this.prepareRecord(LogLevel.FATAL, message, args));
  }

  public audit(message: string, ...args: any[]) {
    args.push({ audit: true });
    this.log(this.prepareRecord(LogLevel.INFO, message, args));
  }

  private log(record: LogRecord) {
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

  private formatError(error: Error): any {
    // Alternative appraoch as suggested on SO:
    // return JSON.stringify(err, Object.getOwnPropertyNames(err));
    return { message: error.message, stack: error.stack, name: error.name };
  }

  private prepareRecord(level: LogLevel, message: string, args: Array<any>): LogRecord {
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
}
