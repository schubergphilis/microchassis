# Changelog
All notable changes to `microchassis` will be documented in this file.

The format is based on [Keep a
Changelog](http://keepachangelog.com/en/1.0.0/) and the project
adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [0.6.5] - 2018-01-17

### Fixed

* Propagation of errors in gRPC client now maintains the original
  error code and message

## [0.6.4] - 2018-01-16

### Fixed

* Fixes gRPC error code handling

### Changed

* Add an get method to the config object

## [0.6.3] - 2018-01-03

### Added

* Multiple fields were added for HTTP server for ease of searching

### Fixed

* Services are no longer passed as singletons to respective services
  thus avoiding potential sharing issues

### Changed

* `HttpServer` and `GrpcServer` now both accept factories of instances
  instead of final instances in `registerService` method

## [0.6.2] - 2018-01-02

### Fixed

* Issue where authorization token was not properly parsed by GRPC server

## [0.6.1] - 2017-12-15

### Fixed

* Dependency on `ajv` added to `package.json`. This fixes npm installations.

## [0.6.0] - 2017-12-15 (release unpublished)

### Fixed

* Multiple type errors

### Changed
* TypeScript `strict` mode is enabled
* `providers.TypeORMProvider`'s `entityManager` is now `readonly`
* TypeORM dependency has been updated to `0.1.1` release
* `Service` implementations must provide gRPC method name

### Added
* Introduces `MicroChassisError` error type
* Introduces `BaseService` class with JSON schema validation (based on
  `ajv`)
* Introduces type parameter for `ServiceResponse` interface. Use of
  un-parametrized is deprecated from now and will be removed in 0.7
  release.

### Removed
* `TypeORMProvider` has been dropped, instead a new abstract class
  `DbProvider` is now available for use as well as basic
  implementation of Mariadb provider has been added under
  `MariadbProvider` name.

## [0.5.1] - 2017-10-06

### Fixed

* gRPC client's `SimpleGrpcClient.call` method has been fixed

### Changed

* Example application has been altered to support recent features of
`microchassis`

### Added

* Example application now has a gRPC-backed endpoint under `/hello2`
  URI

## [0.5.0] - 2017-10-04

### Added
* This changelog has been added
* Events support has been introduced, see `examples/helloworld` for
  usage examples.

### Changed
* `ServiceOptions` interface changed signature for `managers`,
  `services` and `providers` to significantly stricter ones, making
  full use of TypeScript generics support
* TCP connections now default to 30 second timeout
* gRPC client (`SimpleGrpcClient`) will retry a failed call 3 time
  before giving up. The retry behavior is not currently configurable.
* `SimpleGrpcClient.call` method is now `async`


### Removed
* `package.lock` has been removed

## [0.4.3] - 2017-06-20
