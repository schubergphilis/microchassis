import * as crypto from 'crypto';
import { Config } from './../../config';
import { LogRecord } from './../logger';

export function assignSessionHash(config: Config) {
  const secret = config['sessionHashKey'];

  return (record: LogRecord): LogRecord => {
    if (secret && record.extra['context'] !== undefined) {
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(record.extra['context']['token']);
      record.extra['session-hash'] = hmac.digest('hex').substr(0, 10);
    }
    return record;
  }
}
