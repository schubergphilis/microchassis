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

const config = new Config();

const mockLogger = {
  info: (message: string) => {},
  audit: (message: string) => {},
  warn(message: string) {},
  error(message: string) {},
  debug(message: string) {}
};

describe('Grpc server', () => {
  const server = new GrpcServer(grpc, protoConfig, config, <Logger>mockLogger, new HealthManager(<Logger>mockLogger));
});
