import * as util from 'util';
import { Config } from './../../config';
import { LogRecord, LogLevel } from './../logger';

export function consoleHandler(config: Config) {
  return (record: LogRecord) => {
    console.log(JSON.stringify({
      _time: record.time,
      level: LogLevel[record.level],
      message: util.format(record.message, ...record.formatArgs),
      extra: record.extra
    }))
  }
}
