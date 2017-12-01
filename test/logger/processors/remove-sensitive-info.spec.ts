import 'mocha';
import { expect } from 'chai';

import { Config } from './../../../src/config';
import { removeSensitiveInfo } from './../../../src/logger/processors';
import { LogRecord, LogLevel } from './../../../src/logger';

const record: LogRecord = {
  level: LogLevel.DEBUG,
  message: 'Foobar',
  time: new Date(),
  formatArgs: [],
  extra: {
    context: 'sensitive',
    token: 'sensitive',
    user: 'sensitive',
    password: 'sensitive',
    foobar: 'not sensitive'
  }
};

describe('Log processor - remove sensitive info', () => {
  it('should remove sensitive items', () => {
    const strippedRecord = removeSensitiveInfo({} as Config)(record);

    expect(strippedRecord.extra['context']).to.be.undefined;
    expect(strippedRecord.extra['token']).to.be.undefined;
    expect(strippedRecord.extra['user']).to.be.undefined;
    expect(strippedRecord.extra['password']).to.be.undefined;
    expect(strippedRecord.extra['foobar']).to.equal(record.extra['foobar']);
  });

  it('should be possible to extend the sensitive keys through the config', () => {
    const config = new Config([{
      dest: 'sensitiveKeys',
      value: ['foobar']
    }]);

    const strippedRecord = removeSensitiveInfo(config)(record);

    expect(strippedRecord.extra['context']).to.be.undefined;
    expect(strippedRecord.extra['token']).to.be.undefined;
    expect(strippedRecord.extra['user']).to.be.undefined;
    expect(strippedRecord.extra['password']).to.be.undefined;
    expect(strippedRecord.extra['foobar']).to.be.undefined;
  });
});
