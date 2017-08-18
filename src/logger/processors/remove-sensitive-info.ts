import { Config } from './../../config';
import { LogRecord } from './../logger';

export function removeSensitiveInfo(config: Config) {
  let sensitiveKeys = ['token', 'user', 'password', 'context'];

  if (config['sensitiveKeys']) {
    sensitiveKeys = sensitiveKeys.concat(config['sensitiveKeys']);
  }

  return (record: LogRecord): LogRecord => {
    for (const key of sensitiveKeys) {
      if (record.extra[key] !== undefined) {
        delete record.extra[key];
      }
    }
    return record;
  }
}

