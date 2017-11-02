import 'reflect-metadata';

import { expect } from 'chai';
import { sandbox, SinonSandbox, SinonSpy, SinonStub, spy, stub } from 'sinon';
import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';

chai.use(sinonChai);

import { Config } from './../../src/config';
import { Logger, LogRecord, LogLevel } from './../../src/logger';

describe('Logger', () => {
  let logger: Logger;
  let logSpy: SinonSpy;

  it('should throw an exception if no handlers are provided', () => {
    const config = new Config([{
      dest: 'loggerOptions',
      value: {
        handlers: []
      }
    }]);

    expect(() => { new Logger(config); }).to.throw(TypeError);
  });

  it('sets the log level correctly', () => {
    const levels = [
      ['debug', LogLevel.DEBUG],
      ['info', LogLevel.INFO],
      ['warn', LogLevel.WARN],
      ['error', LogLevel.ERROR],
      ['fatal', LogLevel.FATAL]
    ];

    for (const pair of levels) {
      logger = new Logger(new Config([{ dest: 'logLevel', value: pair[0] }]));
      expect(logger.level).to.equal(pair[1]);
    }
  })

  beforeEach(() => {
    logSpy = spy(console, 'log');
    logger = new Logger(new Config([{ dest: 'logLevel', value: 'debug' }]));
  });

  afterEach(() => {
    logSpy.restore();
    logger = new Logger(new Config());
  });

  it('should not attempt to emit messages below specified log level', () => {
    logger.level = LogLevel.INFO;
    logger.debug('A debug level message that should be ignored');
    expect(logSpy.notCalled).to.equal(true, 'debug should be ignored');
    logger.info('A message that should not be ignored');
    expect(logSpy.called).to.equal(true, 'info should not be ignored');
    logger.warn('A message that should not be ignored');
    expect(logSpy.called).to.equal(true, 'warn should not be ignored');
    logger.error('A message that should not be ignored');
    expect(logSpy.called).to.equal(true, 'error should not be ignored');
    logger.fatal('A message that should not be ignored');
    expect(logSpy.called).to.equal(true, 'fatal should not be ignored');
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

  it('should apply processors', () => {
    const processor = () => {
      return (record: LogRecord): LogRecord => {
        record.extra['processed'] = true;
        return record;
      }
    }

    logger = new Logger(new Config([{
      dest: 'loggerOptions',
      value: {
        processors: [processor]
      }
    }]))


    logger.info('An info level message', {
      token: 'foobar',
      foo: 'bar'
    });

    const arg = logSpy.getCall(0).args[0];
    const obj = JSON.parse(arg);

    expect(obj.extra.processed).to.equal(true);
  });

  it('should leave the original object untouched when deleting properties in a processor', () => {
    const processor = () => {
      return (record: LogRecord): LogRecord => {
        delete record.extra['token'];
        return record;
      }
    }

    logger = new Logger(new Config([{
      dest: 'loggerOptions',
      value: {
        processors: [processor]
      }
    }]))

    const context = {
      token: 'foobar'
    };

    logger.info('An info level message', context);

    const arg = logSpy.getCall(0).args[0];
    const obj = JSON.parse(arg);

    expect(obj.extra.token).to.be.undefined;
    expect(context.token).to.equal('foobar');
  });
});


// Still needs to be tested:
// * proper filtering by log level
// * usage of processors
// * usage of handlers
// * handling of exceptions
