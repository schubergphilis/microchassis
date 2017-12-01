import 'reflect-metadata';

import { expect } from 'chai';
import 'mocha';

import { Config } from './../src/config';

describe('Config', () => {
  let config: Config;

  beforeEach(() => {
    config = new Config();
  });

  it('It should have default ports for http and grpc', () => {
    expect((<any>config)['httpPort']).to.equal(8000);
    expect((<any>config)['grpcPort']).to.equal(9000);
  });

  it('Default log level should be info', () => {
    expect((<any>config)['logLevel']).to.equal('info');
  });
});
