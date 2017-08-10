import { injectable, inject } from 'inversify';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Config } from './../config';
import * as grpcExt from 'grpc/src/node/src/grpc_extension';
const connectivityState = grpcExt.connectivityState;

import { Context, Logger, ProtoConfig, HealthManager } from './..'

@injectable()
export class SimpleGrpcClient {
  public health =  new BehaviorSubject(false);
  public protoConfig: ProtoConfig;
  public serviceAddress: string;
  public client;
  public grpc;
  public healthManager: HealthManager;
  public logger: Logger;
  public callTimeout = 5; // timeout/deadline for grpc calls in seconds
  private channelState = new BehaviorSubject(-1);

  constructor(config: Config) {
    if (config['grpcClientTimeout']) {
      this.callTimeout = config['grpcClientTimeout'];
    }
  }

  public connect() {
    this.healthManager.registerCheck(this.protoConfig.service, this.health);

    this.channelState.subscribe((state) => {
      if (state !== connectivityState.READY) {
        this.health.next(false);
      } else {
        this.health.next(true);
      }
    });

    // Load the proto and create service
    const proto = this.grpc.load(this.protoConfig.path);
    let ServiceClass;

    if (this.protoConfig.package) {
      ServiceClass = proto[this.protoConfig.package][this.protoConfig.service];
    } else {
      ServiceClass = proto[this.protoConfig.service];
    }

    this.client = new ServiceClass(this.serviceAddress, this.grpc.credentials.createInsecure());

    // Wiat for client to be ready and start health monitoring
    this.client.waitForReady(Infinity, (error) => {
      if (!error) {
        this.health.next(true);
        this.monitorGRPCHealth(connectivityState.READY);
      } else {
        // This should be really fatal since we are waiting infinite for the client to become ready
        this.logger.error('Failed to connect to GRPC client', error);
        this.health.next(false)
      }
    });
  }

  // Use this to call actual methods on the client
  public call(method: string, context: Context, message: any): Promise<any> {
    this.logger.debug(`Calling ${method} on ${this.protoConfig.service} with:`, message);

    const meta = context ? this.transformContext(context) : this.grpc.Metadata();

    return new Promise((resolve, reject) => {
      // method names in the proto are with capitals, make sure that if you pass them
      // with an capital it works to
      const normalizedMethod = method.charAt(0).toLowerCase() + method.slice(1);

      // Build deadline object
      const now = new Date();
      const deadline = now.setSeconds(now.getSeconds() + this.callTimeout);

      if (!this.client[normalizedMethod]) {
        const errorMessage = `RPC method: ${method} doesn't exist on GRPC client: ${this.protoConfig.service}`;
        this.logger.error(errorMessage);
        reject(new Error(errorMessage));
      } else {
        this.client[normalizedMethod](message, meta, { deadline: deadline }, (error, response) => {
          if (error) {
            this.logger.error(`Call ${method} on ${this.protoConfig.service} failed with error: `, error);
            console.error(error);
            reject(error);
          } else {
            this.logger.debug(`Call ${method} on ${this.protoConfig.service} responded with: `, response);
            resolve(response);
          }
        });
      }
    });
  }

  // Recursive function that emits the channelState
  private monitorGRPCHealth(currentState) {
    this.client.getChannel().watchConnectivityState(currentState, Infinity, () => {
      const newState = this.client.getChannel().getConnectivityState(true);
      this.channelState.next(newState);
      this.monitorGRPCHealth(newState);
    });
  }

  // Transforms context to grpc metadata
  private transformContext(context: Context) {
    const meta = new this.grpc.Metadata();
    meta.add('Authorization', context.token);
    meta.add('request-id', context.requestId);

    return meta;
  }
}
