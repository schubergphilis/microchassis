import 'mocha';
import { expect } from 'chai';

import { Config } from './../../../src/config';
import { assignVersion } from './../../../src/logger/processors';
import { LogRecord, LogLevel } from './../../../src/logger';

describe('Log processor - assign version', () => {
  it('should add app-version', () => {
    const config = new Config([{
      dest: 'applicationVersion',
      value: 'v1'
    }]);

    const record: LogRecord = {
      level: LogLevel.DEBUG,
      message: 'Foobar',
      time: new Date(),
      formatArgs: [],
      extra: {
        foo: 'bar'
      }
    };

    const versionedRecord = assignVersion(config)(record);

    expect(versionedRecord.extra['app-version']).to.equal('v1');
    expect(versionedRecord.extra['foo']).to.equal(record.extra['foo']);
  });
});
