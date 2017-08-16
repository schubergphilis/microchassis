import 'reflect-metadata';

import { expect } from 'chai';
import { sandbox, SinonSandbox, SinonSpy, SinonStub, spy, stub } from 'sinon';
import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';

chai.use(sinonChai);

import { Config } from './../src/config';
import { Logger, LogRecord, LogLevel } from './../src/logger';

describe('Logger', () => {
  let logger: Logger;
  let logSpy: SinonSpy;

  it('should throw an exception if no handlers are provided', () => {
    expect(() => { new Logger(new Config(), [], []) }).to.throw(TypeError);
  });

  it('sets the log level correctly', () => {
    const levels = [['debug', LogLevel.DEBUG],
    ['info', LogLevel.INFO],
    ['warn', LogLevel.WARN],
    ['error', LogLevel.ERROR],
    ['fatal', LogLevel.FATAL]];
    for (const pair of levels) {
      const logger = new Logger(new Config([{ dest: 'logLevel', value: pair[0] }]));
      expect(logger.level).to.equal(pair[1]);
    }
  })

  beforeEach(() => {
    logSpy = spy(console, 'log');
    const processors = [
      (record: LogRecord) => { delete record.extra['token']; return record; }];
    logger = new Logger(new Config([{ dest: 'logLevel', value: 'debug' }]), processors);
  });

  afterEach(() => {
    logSpy.restore();
    logger = undefined;
  });

  it('should filter out the token', () => {
    logger.info('An info level message', {
      token: 'foobar',
      foo: 'bar'
    });

    const arg = logSpy.getCall(0).args[0];
    const obj = JSON.parse(arg);

    expect(obj.level).to.equal('INFO');
    expect(obj.extra.token).to.equal(undefined);
    expect(obj.extra.foo).to.equal('bar');
  });

  it('should not attempt to emit messages below specified log level', () => {
    logger.level = LogLevel.INFO;
    logger.debug('A debug level message that should be ignored');
    expect(logSpy.notCalled).to.equal(true);
    logger.info('A message that should not be ignored');
    expect(logSpy.called).to.equal(true);
    logger.warn('A message that should not be ignored');
    expect(logSpy.called).to.equal(true);
    logger.error('A message that should not be ignored');
    expect(logSpy.called).to.equal(true);
    logger.fatal('A message that should not be ignored');
    expect(logSpy.called).to.equal(true);
  });

  it('should correctly handle exceptions', () => {
    const exceptionMessage = 'I do not do much';
    try {
      throw TypeError(exceptionMessage)
    } catch (exc) {
      logger.exception(exc, 'Logging exception');
      expect(logSpy.called).to.equal(true);
      expect(JSON.parse(logSpy.firstCall.args[0]).extra.error.message).to.equal(exceptionMessage);
    }
  });

  it('should mark audit records as such', () => {
    logger.audit('Important audit message');
    expect(logSpy.called).to.equal(true);
    expect(JSON.parse(logSpy.firstCall.args[0]).extra).to.include({ audit: true })
  });

  it('should concatenate multiple messages', () => {
    logger.info('A partial', 'message');
    expect(logSpy.called).to.equal(true);
    expect(JSON.parse(logSpy.firstCall.args[0]).message).to.equal('A partial message');
  });

  it('should format messages', () => {
    logger.info('A %s message', 'formatted');
    expect(logSpy.called).to.equal(true);
    expect(JSON.parse(logSpy.firstCall.args[0]).message).to.equal('A formatted message');
  });

  it('should correctly merge extra objects', () => {
    logger.info('A message with something extra', { foo: 'foo' }, { bar: 'bar' });
    expect(logSpy.called).to.equal(true);
    expect(JSON.parse(logSpy.firstCall.args[0]).extra).to.include({ foo: 'foo', bar: 'bar' });
  });
});


// Still needs to be tested:
// * proper filtering by log level
// * usage of processors
// * usage of handlers
// * handling of exceptions
