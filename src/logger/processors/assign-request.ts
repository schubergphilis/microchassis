import { Config } from './../../config';
import { LogRecord } from './../logger';

export function assignRequestId(_: Config) {
  return (record: LogRecord): LogRecord => {
    if (record.extra['context'] !== undefined) {
      record.extra['request-id'] = record.extra['context']['requestId'];
    }
    return record;
  }
}
