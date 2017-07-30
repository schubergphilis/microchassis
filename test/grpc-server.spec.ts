import { GrpcServer } from './../src/grpc-server';
import { HealthManager } from './../src/health';
import { Logger } from './../src/logger';
import { Config } from './../src/config';

class Server {}

const grpc = {
  Server,
  load: () => {}
};

const protoConfig = {
  path: '',
  service: ''
};

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
};

describe('Grpc server', () => {
  new GrpcServer(grpc, protoConfig, <Config>config, <Logger>mockLogger, new HealthManager(<Logger>mockLogger));
});