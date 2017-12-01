import { Config } from './../../config';
import { LogRecord } from './../logger';

export function assignVersion(config: Config) {
  const version = (<any>config)['applicationVersion'];

  return (record: LogRecord): LogRecord => {
    if (version !== undefined) {
      record.extra['app-version'] = version;
    }
    return record;
  };
}
