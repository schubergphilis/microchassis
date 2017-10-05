import * as path from 'path';
import { injectable, inject } from 'inversify';
import { Config, Context, HealthManager, Logger, ProtoConfig, SimpleGrpcClient } from './../../src';

@injectable()
export class GRPCClient extends SimpleGrpcClient {
  public protoConfig: ProtoConfig = {
    path: `${__dirname}/../proto/hello.proto`,
    package: 'hellopb',
    service: 'HelloService'
  };

  constructor(
    @inject('grpc')
    public grpc: any,
    public healthManager: HealthManager,
    public logger: Logger,
    private config: Config
  ) {
    super(config);
    this.serviceAddress = 'localhost:9000';
    this.connect();
  }
}
