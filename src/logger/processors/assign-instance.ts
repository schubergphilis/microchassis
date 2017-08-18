import { v4 as uuid } from 'uuid';
import { Config } from './../../config';
import { LogRecord } from './../logger';

const func = function(config: Config) {
  const instanceId = config['instanceId'] || uuid();

  return (record: LogRecord): LogRecord => {
    if (instanceId !== undefined) {
      record.extra['instance-id'] = instanceId;
    }
    return record;
  };
}

export const assignInstanceId = func;
