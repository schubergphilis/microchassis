import 'reflect-metadata';

import { expect } from 'chai';
import { sandbox, SinonSandbox, SinonSpy, spy } from 'sinon';
import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';

chai.use(sinonChai);

import { Config } from './../src/config';
import { Logger } from './../src/logger';

describe('Logger', () => {
  let logger: Logger;
  let logSpy: SinonSpy;

  beforeEach(() => {
    logSpy = spy(console, 'log');
    logger = new Logger(<Config>{});
  });

  it('It should filter out the token', () => {
    logger.info({
      token: 'foobar',
      foo: 'bar'
    });

    const arg = logSpy.getCall(0).args[0];
    const obj = JSON.parse(arg);

    expect(obj.level).to.equal('info');
    expect(obj.message[0].token).to.equal(undefined);
    expect(obj.message[0].foo).to.equal('bar');

    logSpy.restore();
  });
});
