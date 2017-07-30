import 'reflect-metadata';

import { expect } from 'chai';

import { Config } from './../src/config';

describe('Config', () => {
  let config: Config;

  beforeEach(() => {
    config = new Config();
  });

  it('It should have default ports for http and grpc', () => {
    expect(config.httpPort).to.equal(8000);
    expect(config.grpcPort).to.equal(9000);
  });

  it('Default log level should be info', () => {
    expect(config.logLevel).to.equal('info');
  });
});