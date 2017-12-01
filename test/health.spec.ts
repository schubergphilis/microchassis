import 'reflect-metadata';
import 'mocha';
import { expect } from 'chai';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { Logger } from './../src/logger';
import { HealthManager } from './../src/health';

const mockLogger = {
  info: (_: string) => { },
  audit: (_: string) => { },
  warn(_: string) { },
  error(_: string) { },
  debug(_: string) { }
}

describe('HealthManager', () => {
  let healthManager: HealthManager;

  beforeEach(() => {
    healthManager = new HealthManager(<Logger>mockLogger);
  });

  it('Initial health should be false', () => {
    expect(healthManager.healthy).to.equal(false);
  });

  describe('registerCheck', () => {
    it('Should be possible to register an health check', () => {
      const check = new BehaviorSubject(false);
      healthManager.registerCheck('foobar', check);
      expect(healthManager.numberOfChecks).to.equal(1);
    });

    it('Should throw an error when registering the same name', () => {
      const check = new BehaviorSubject(true);

      function register() {
        healthManager.registerCheck('foo', check);
        healthManager.registerCheck('foo', check);
      }

      expect(register).to.throw();
    });

    it('When register a check it should listen to its status', () => {
      const check = new BehaviorSubject(true);
      healthManager.registerCheck('foobar', check);
      expect(healthManager.healthy).to.equal(true);
    });

    it('Should behave correctly with multiple health checks', () => {
      const checkOne = new BehaviorSubject(false);
      const checkTwo = new BehaviorSubject(true);
      const checkThree = new BehaviorSubject(false);

      healthManager.registerCheck('one', checkOne);
      healthManager.registerCheck('two', checkTwo);

      expect(healthManager.healthy).to.equal(false);
      checkOne.next(true);
      expect(healthManager.healthy).to.equal(true);

      healthManager.registerCheck('three', checkThree);
      expect(healthManager.healthy).to.equal(false);
      expect(healthManager.numberOfChecks).to.equal(3);
    });

    it('Should update the status when a service becomes unhealthy', () => {
      const check = new BehaviorSubject(true);
      healthManager.registerCheck('one', check);

      expect(healthManager.healthy).to.equal(true);
      check.next(false);
      expect(healthManager.healthy).to.equal(false);
      check.next(true);
      expect(healthManager.healthy).to.equal(true);
    });
  });
});
