import * as chai from 'chai';
import { expect } from 'chai';

import { Config } from './../../../src/config';
import { assignRequestId } from './../../../src/logger/processors';
import { LogRecord, LogLevel } from './../../../src/logger';

describe('Log processor - assign request id', () => {
  it('should add request-id', () => {
    const record: LogRecord = {
      level: LogLevel.DEBUG,
      message: 'Foobar',
      time: new Date(),
      formatArgs: [],
      extra: {
        context: {
          'requestId': 'requestid'
        }
      }
    };

    const assignedRecord = assignRequestId({} as Config)(record);

    expect(assignedRecord.extra['request-id']).to.exist;
    expect(assignedRecord.extra['request-id']).to.equal(record.extra['context']['requestId']);
  });
});
