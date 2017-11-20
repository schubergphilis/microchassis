# Changelog
All notable changes to `microchassis` will be documented in this file.

The format is based on [Keep a
Changelog](http://keepachangelog.com/en/1.0.0/) and the project
adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased

### Changed
* `providers.TypeORMProvider`'s `entityManager` is now `readonly`
* TypeORM dependency has been updated to `0.1.1` release
* `Service` implementations must provide gRPC method name
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
