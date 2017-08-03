import { injectable, inject } from 'inversify';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import * as grpcExt from 'grpc/src/node/src/grpc_extension';
const connectivityState = grpcExt.connectivityState;

import { Context, Logger, ProtoConfig, HealthManager } from './..'

@injectable()
export class SimpleGrpcClient {
  public health =  new BehaviorSubject(false);
  public protoConfig: ProtoConfig;
  public serviceAddress: string;
  public client;

  private channelState = new BehaviorSubject(-1);

  constructor(@inject('grpc') private grpc: any,
              private healthManager: HealthManager,
              private logger: Logger) {

                // Setup health check
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

  // Use this to call actual services on the client
  public call(serviceName: string, message: any, context?: Context): Promise<any> {
    const meta = context ? this.transformContext(context) : this.grpc.Metadata();

    return new Promise((resolve, reject) => {
      this.client[serviceName](message, meta, (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
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

    return meta;
  }
}
