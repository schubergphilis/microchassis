import { injectable } from 'inversify';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import * as grpcExt from 'grpc/src/grpc_extension';
import * as async from 'async';
import * as grpc from 'grpc';
const connectivityState = grpcExt.connectivityState;

import { Config, Context, Logger, ProtoConfig, HealthManager } from '..'
import * as errors from '../errors';
import { GrpcObject } from 'grpc';

@injectable()
export class SimpleGrpcClient {
  public health = new BehaviorSubject(false);
  public protoConfig!: ProtoConfig;
  public serviceAddress!: string;
  public client!: grpc.Client;
  public healthManager!: HealthManager;
  public logger!: Logger;
  public callTimeout = 5; // timeout/deadline for grpc calls in seconds
  private channelState = new BehaviorSubject(-1);

  constructor(config: Config) {
    if ((<any>config)['grpcClientTimeout']) {
      this.callTimeout = (<any>config)['grpcClientTimeout'];
    }
  }

  public connect() {
    this.healthManager.registerCheck(this.protoConfig.service, this.health);

    this.channelState.subscribe((state) => {
      this.health.next(state === connectivityState.READY)
    });

    // Load the proto and create service
    const proto: GrpcObject = grpc.load(this.protoConfig.path);
    let ServiceClass: typeof grpc.Client;

    if (this.protoConfig.package) {
      const pkg: GrpcObject = (proto[this.protoConfig.package]) as GrpcObject;
      ServiceClass = pkg[this.protoConfig.service] as (typeof grpc.Client);
    } else {
      ServiceClass = proto[this.protoConfig.service] as (typeof grpc.Client);
    }

    this.client = new ServiceClass(this.serviceAddress, grpc.credentials.createInsecure());

    // Wiat for client to be ready and start health monitoring
    this.client.waitForReady(Infinity, (error: Error | null) => {
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

  // gRPC method names need to camel-cased
  private normalizeMethodName(methodName: string): string {
    this.logger.debug(`Normalizing method name ${methodName}`);
    return methodName.charAt(0).toLowerCase() + methodName.slice(1);
  }

  // Calls the gRPC method
  public async call(methodName: string, context: Context, message: any): Promise<any> {
    methodName = this.normalizeMethodName(methodName);
    this.logger.debug(`Calling ${methodName} on ${this.protoConfig.service} with:`, message);

    if (!(this.client as any)[methodName]) {
      const errorMessage = `RPC method: ${methodName} doesn't exist on GRPC client: ${this.protoConfig.service}`;
      this.logger.error(errorMessage);
      throw Error(errorMessage);
    }

    const meta = context ? this.transformContext(context) : new grpc.Metadata();
    return new Promise((resolve, reject) => {
      const methodCallback = (error: errors.GrpcError, response: any) => {
        if (error) {
          this.logger.error(`Call ${methodName} on ${this.protoConfig.service} failed with error: `, error);
          console.error(error);
          reject(errors.fromGrpcError(error));
        } else {
          this.logger.debug(`Call ${methodName} on ${this.protoConfig.service} responded with: `, response);
          resolve(response);
        }
      };
      const wrappedCall = (callback: any) => {
        const now = new Date();
        const deadline = now.setSeconds(now.getSeconds() + this.callTimeout);
        return (this.client as any)[methodName](message, meta, { deadline: deadline }, callback);
      };
      async.retry<any, any>(3, wrappedCall, methodCallback);
    });
  }

  // Recursive function that emits the channelState
  private monitorGRPCHealth(currentState: any) {
    this.client.getChannel().watchConnectivityState(currentState, Infinity, () => {
      const newState = this.client.getChannel().getConnectivityState(true);
      this.channelState.next(newState);
      this.monitorGRPCHealth(newState);
    });
  }

  // Transforms context to grpc metadata
  private transformContext(context: Context) {
    const meta = new grpc.Metadata();
    meta.add('Authorization', context.token || '');
    meta.add('request-id', context.requestId || '');
    return meta;
  }
}
