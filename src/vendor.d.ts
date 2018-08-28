// // Partial implementation taken from
// // https://raw.githubusercontent.com/grpc/grpc-node/master/packages/grpc-native-core/index.d.ts
// // Further implementations should upgrade to latest gRPC version.

// declare module 'grpc' {
//   export function load(filename: string): any;
//   export class Metadata {
//     add(key: string, value: string): void;
//   }
//   export class Server { }
//   export class ServerCredentials {
//     static createInsecure(): ServerCredentials;
//   }
//   export const credentials: {
//     createInsecure(): any;
//   };

//   export enum Status {
//     OK = 0,
//     CANCELLED,
//     UNKNOWN,
//     INVALID_ARGUMENT,
//     DEADLINE_EXCEEDED,
//     NOT_FOUND,
//     ALREADY_EXISTS,
//     PERMISSION_DENIED,
//     RESOURCE_EXHAUSTED,
//     FAILED_PRECONDITION,
//     ABORTED,
//     OUT_OF_RANGE,
//     UNIMPLEMENTED,
//     INTERNAL,
//     UNAVAILABLE,
//     DATA_LOSS,
//     UNAUTHENTICATED
//   }
// }

declare module 'grpc/src/grpc_extension' {
  export enum connectivityState {
    CONNECTING,
    READY,
    TRANSIENT_FAILURE,
    IDLE,
    SHUTDOWN
  }
}

declare module 'mock-express-request' {
  class C {
    constructor(...args: any[]);
  }
  namespace C { }
  export = C;
}
