import * as chai from 'chai';
import { expect } from 'chai';

import { Config } from './../../../src';
import { assignInstanceId } from './../../../src/logger/processors';
import { LogRecord, LogLevel } from './../../../src/logger';

describe('Log processor - assign instance id', () => {
  const record: LogRecord = {
    level: LogLevel.DEBUG,
    message: 'Foobar',
    time: new Date(),
    formatArgs: [],
    extra: {}
  };

  it('should add instance-id', () => {
    const assignedRecord = assignInstanceId({} as Config)(record)
    expect(assignedRecord.extra['instance-id']).to.exist;
  });

  it('When generated it should stay the same when calling multiple times', () => {
    const assignedRecordOne = assignInstanceId({} as Config)(record)
    const assignedRecordTwo = assignInstanceId({} as Config)(record)
    expect(assignedRecordOne.extra['instance-id']).to.exist;
    expect(assignedRecordTwo.extra['instance-id']).to.exist;
    expect(assignedRecordOne.extra['instance-id']).to.equal(assignedRecordTwo.extra['instance-id']);
  });

  it('should be possible to set instance id through config', () => {
    const config = new Config([
      {
        dest: 'instanceId',
        value: 'foobar'
      }
    ]);

    const assignedRecordThree = assignInstanceId(config)(record)

    expect(assignedRecordThree.extra['instance-id']).to.exist;
    expect(assignedRecordThree.extra['instance-id']).to.equal('foobar');
  });
});


