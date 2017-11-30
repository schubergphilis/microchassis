import { expect } from 'chai';
import 'mocha';
import { Config } from './../../../src/config';
import { consoleHandler, LogLevel, LogRecord } from './../../../src/logger';

describe('Logger - consoleHandler', () => {
  it('should convert LogRecord to proper string', () => {
    const date = new Date();

    const record: LogRecord = {
      level: LogLevel.DEBUG,
      message: 'Foobar',
      time: date,
      formatArgs: [],
      extra: {}
    }

    // @TODO TODO: verify if it logged correctly
    consoleHandler({} as Config)(record);
    expect(true).to.equal(true);
  });
});
