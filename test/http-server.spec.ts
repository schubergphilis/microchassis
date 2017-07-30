import 'reflect-metadata';

import * as sinonChai from 'sinon-chai';
import * as sinon from 'sinon';
import * as chai from 'chai';
chai.use(sinonChai);

import { SinonSpy } from 'sinon';
import { expect } from 'chai';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Request } from 'express';
import * as MockRequest from 'mock-express-request';

import { HttpMethod } from './../src/service';
import { Config } from './../src/config';
import { Logger } from './../src/logger';
import { HealthManager } from './../src/health' ;
import { Context } from './../src/context';
import { HttpServer } from './../src/http-server';

const config = {
  httpPort: 8000,
  grpcPort: 9000,
  logLevel: 'info'
};

const mockLogger = {
  info: (message: string) => {},
  audit: (message: string) => {},
  warn(message: string) {},
  error(message: string) {},
  debug(message: string) {}
}

describe('Http server', () => {
  let httpServer: HttpServer;
  let healthManager: HealthManager;
  let healthSpy: SinonSpy;
  let mockExpress;

  // Express mock spies
  let expressInstantiated;
  let getSpy: SinonSpy;
  let postSpy: SinonSpy;
  let deleteSpy: SinonSpy;
  let patchSpy: SinonSpy;
  let listenSpy: SinonSpy;

  beforeEach(() => {
    healthManager = new HealthManager(<Logger>mockLogger);
    healthSpy = sinon.spy();
    healthManager.registerCheck = healthSpy;

    // Reset
    expressInstantiated = false;
    getSpy = sinon.spy();
    postSpy = sinon.spy();
    deleteSpy = sinon.spy();
    patchSpy = sinon.spy();
    listenSpy = sinon.spy();

    mockExpress = () => {
      expressInstantiated = true;
      return {
        get: getSpy,
        post: postSpy,
        delete: deleteSpy,
        patch: patchSpy,
        listen: listenSpy
      }
    };

    httpServer = new HttpServer(mockExpress, <Config>config, <Logger>mockLogger, healthManager);
  });

  describe('Constructor', () => {
    it('should instantiate an express server', () => {
      expect(expressInstantiated).to.equal(true);
    });

    it('should register with the health manager with initial state unhealthy', () => {
      expect(healthSpy).to.have.been.calledOnce;

      const check: BehaviorSubject<boolean> = healthSpy.getCall(0).args[1];
      expect(check).to.be.an.instanceOf(BehaviorSubject);
      expect(check.getValue()).to.equal(false);
    });

    it('should register an health endpoint on the server', () => {
      expect(getSpy).to.have.been.calledOnce;
      const url = getSpy.getCall(0).args[0];
      const handler = getSpy.getCall(0).args[1];

      expect(url).to.equal('/health');

      let responseCode;
      let responseText;

      const response = {
        status: (statusCode) => {
          responseCode = statusCode;

          return {
            send: (response) => {
              responseText = response;
            }
          }
        }
      };

      handler({}, response);

      expect(responseCode).to.equal(503);
      expect(responseText).to.equal('Unhealthy');

      healthManager.healthy = true;
      handler({}, response);
      
      expect(responseCode).to.equal(200);
      expect(responseText).to.equal('Healthy');
    });
  });

  describe('registerService', () => {
    it('Default method should be get', () => {
      const service = {
        url: '/foobar',
        handler: () => {}
      };

      httpServer.registerService(service);

      // Twice, health and this new service
      expect(getSpy).to.have.been.calledTwice;
    });

    it('Should normalize the url to start with /', () => {
      const service = {
        url: 'foobar',
        handler: () => {}
      };

      httpServer.registerService(service);

      // Twice, health and this new service
      expect(getSpy).to.have.been.calledTwice;
      const url = getSpy.getCall(1).args[0];
      expect(url).to.equal('/foobar');
    });
  });

  describe('start', () => {
    it('It should call listen on express when starting server with the correct port', () => {
      httpServer.start();
      expect(listenSpy).to.have.been.calledOnce;
      expect(listenSpy.getCall(0).args[0]).to.equal(config.httpPort);
    }); 

    it('It should send out an health update when the server is started', () => {
      httpServer.start();

      expect(httpServer.health.getValue()).to.equal(false);

      // Given callback
      listenSpy.getCall(0).args[1]();
  
      expect(httpServer.health.getValue()).to.equal(true);
    });
  });

  describe('Handleing requests', () => {
    it('Should build up the context correctly', () => {
      const handlerSpy = sinon.spy();
      const service = {
        url: '/foobar',
        handler: handlerSpy
      };

      httpServer.registerService(service);

      const handler = getSpy.getCall(1).args[1];
      const expectedToken = 'foobar';
      const expectedRequestId = 'requestid';

      const request = new MockRequest({
        method: 'GET',
        url: '/foobar',
        headers: {
          'Authorization': `Token ${expectedToken}`,
          'X-Request-ID': expectedRequestId
        }
      }); 

      handler(request, {});

      const args = handlerSpy.getCall(0).args;
      const context: Context = args[0];
      
      expect(context.token).to.equal(expectedToken);
      expect(context.requestId).to.equal(expectedRequestId);
    });

    it('Should reject unauthenticated requests with 403', () => {
      const handlerSpy = sinon.spy();
      const service = {
        url: '/foobar',
        handler: handlerSpy
      };

      httpServer.registerService(service);

      const handler = getSpy.getCall(1).args[1];
      const request = new MockRequest({
        headers: {}
      });

      let responseText;
      let statusCode;

      const response = {
        status: (status: number) => {
          statusCode = status;
          return {
            send: (response: string) => {
              responseText = response;
            }
          }
        }
      }

      handler(request, response);

      expect(statusCode).to.equal(403);
      expect(responseText).to.equal('Unauthenticated');
    });

    it('Should map query params correctly', () => {
      const handlerSpy = sinon.spy();

      const service = {
        url: '/foobar',
        queryMapping: {
          'foo': 'somekey',
          'bar': 'some.other.key'
        },
        handler: handlerSpy,
        unauthenticated: true
      };

      httpServer.registerService(service);
      const handler = getSpy.getCall(1).args[1];
      const request = new MockRequest({
        method: 'GET',
        url: '/foobar',
        query: {
          'foo': 'hello',
          'bar': 'world'
        },
        body: {}
      }); 

      handler(request, {});

      const body = handlerSpy.getCall(0).args[1];
      expect(body.somekey).to.equal('hello');
      expect(body.some.other.key).to.equal('world');
    });

    it('Should map url params correctly', () => {
      const handlerSpy = sinon.spy();

      const service = {
        url: '/:id/:id2/foobar',
        urlMapping: {
          id1: 'foo.bar',
          id2: 'hello'
        },
        handler: handlerSpy,
        unauthenticated: true
      };

      httpServer.registerService(service);
      
      const handler = getSpy.getCall(1).args[1];
      const request = new MockRequest({
        method: 'GET',
        url: '/1/2/foobar',
        params: {
          id1: '1',
          id2: '2'
        }
      }); 

      handler(request, {});

      const body = handlerSpy.getCall(0).args[1];
      expect(body.foo.bar).to.equal('1');
      expect(body.hello).to.equal('2')
    });

    it('It should return an error code when callback returns an error', () => {
      const handlerSpy = sinon.spy();

      const service = {
        url: '/foobar',
        handler: handlerSpy,
        unauthenticated: true
      };

      httpServer.registerService(service);
      
      const handler = getSpy.getCall(1).args[1];
      const request = new MockRequest({
        method: 'GET',
        url: '/foobar'
      }); 

      let responseText;
      let statusCode;

      const response = {
        status: (status: number) => {
          statusCode = status;
          return {
            send: (response: string) => {
              responseText = response;
            }
          }
        }
      }

      handler(request, response);

      const args = handlerSpy.getCall(0).args;
      const callback = args[2];

      callback('error', {});

      expect(statusCode).to.equal(500);
      expect(responseText).to.equal('Internal server error');
    });

    it('It should return success and content is callback called without error', () => {
      const handlerSpy = sinon.spy();

      const service = {
        url: '/foobar',
        handler: handlerSpy,
        unauthenticated: true
      };

      httpServer.registerService(service);
      
      const handler = getSpy.getCall(1).args[1];
      const request = new MockRequest({
        method: 'GET',
        url: '/foobar'
      }); 

      let handlerResponse;
      let statusCode;

      const response = {
        status: (status: number) => {
          statusCode = status;
          return {
            send: (response: string) => {
              handlerResponse = response;
            }
          }
        }
      }

      handler(request, response);

      const args = handlerSpy.getCall(0).args;
      const callback = args[2];
      const responseBody = { foo: 'bar' };

      callback(undefined, responseBody);

      expect(statusCode).to.equal(200);
      expect(handlerResponse).to.equal(responseBody);
    });
  });
});