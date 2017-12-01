import 'mocha';
import { expect } from 'chai';

import { Config } from './../../../src/config';
import { assignSessionHash } from './../../../src/logger/processors';
import { LogRecord, LogLevel } from './../../../src/logger';

describe('Log processor - assign session hash', () => {
  it('should add session-hash', () => {
    const config = new Config([{
      dest: 'sessionHashKey',
      value: 'foobar'
    }]);

    const record: LogRecord = {
      level: LogLevel.DEBUG,
      message: 'Foobar',
      time: new Date(),
      formatArgs: [],
      extra: {
        context: {
          token: 'mysupersecrettoken'
        }
      }
    };

    const assignedRecord = assignSessionHash(config)(record);

    expect(assignedRecord.extra['session-hash']).to.not.equal(record.extra['context']['token']);
    expect(assignedRecord.extra['session-hash'].length).to.equal(10);
  });
});
