# Microchassis
This package aims to help you build "simple" microservices in Typescript.

[![travis][travis-image]][travis-url]
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/bb6b65f7e0ee4280b6bfd8fd6f1db2b7)](https://www.codacy.com/app/mishok13/microchassis?utm_source=github.com&utm_medium=referral&utm_content=schubergphilis/microchassis&utm_campaign=badger)
[![Coverage Status](https://coveralls.io/repos/schubergphilis/microchassis/badge.svg?branch=master&service=github)](https://coveralls.io/github/schubergphilis/microchassis?branch=master)
[![npm][npm-image]][npm-url]
[![downloads][downloads-image]][downloads-url]
[![Known Vulnerabilities](https://snyk.io/test/github/schubergphilis/microchassis/badge.svg)](https://snyk.io/test/github/schubergphilis/microchassis)

[travis-image]: https://img.shields.io/travis/schubergphilis/microchassis.svg?style=flat
[travis-url]: https://travis-ci.org/schubergphilis/microchassis
[npm-image]: https://img.shields.io/npm/v/microchassis.svg?style=flat
[npm-url]: https://npmjs.org/package/microchassis
[downloads-image]: https://img.shields.io/npm/dm/microchassis.svg?style=flat
[downloads-url]: https://npmjs.org/package/microchassis

The Connect team at Schuberg Philis is building microservices which use [Protobuf](https://github.com/google/protobuf) and [GRPC](https://grpc.io) as a basis and bolt REST on top of that for web usage. This package aims to use the proto as the basis for the service and make it simple to bolt REST on top of that.

It will help you setup health checks, do input validation etc. So that you can focus on implementing the actual business logic.

## Getting started
There is an example service in the [repo](https://github.com/schubergphilis/microchassis/tree/master/example).

You can run this example using ts-node for example:

``` ts-node service.ts ```

This will start a really simple service based on the [proto](https://github.com/schubergphilis/microchassis/blob/master/example/proto/hello.proto) file. It will expose the HTTP server on the default 8000 port and the GRPC server on port 9000.

## Concepts
This package is working based on a couple of concepts:
- [service](https://github.com/schubergphilis/microchassis/blob/master/docs/services.md) actual implementation of the GRPC services defined in the proto. The logic of mapping these to a REST endpoint is also contained in them.
- [managers](https://github.com/schubergphilis/microchassis/blob/master/docs/managers.md) managers contain logic used by the services to accomplish their goal.
- [providers](https://github.com/schubergphilis/microchassis/blob/master/docs/providers.md) providers provide an service mostly used by the managers to be able to do their job. Think of a database connections for example. Usually they register themselves with the [healthmanager](https://github.com/schubergphilis/microchassis/blob/src/health.ts) to be incorporated into the service healthcheck


## Dependency injection
This framework relies heavily on dependency injection and uses [inversify](https://github.com/inversify/InversifyJS) for that. Whenever you need an dependency in your services or managers you should use the constructor to inject it.

You can see an example in the [helloservice](https://github.com/schubergphilis/microchassis/blob/master/example/services/hello.ts) which gets the HelloManager injected. Notice the ```@injectable``` decorator on the [manager](https://github.com/schubergphilis/microchassis/blob/master/example/managers/hellomanager.ts) don't forget this otherwise an error will be thrown.
