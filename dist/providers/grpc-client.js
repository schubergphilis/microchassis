import * as grpc from 'grpc';
export class GrpcClient {
    constructor(protoPath, location, port = 9000) {
        const proto = grpc.load(protoPath);
        console.log(proto);
        // console.log(protoPath, location, port);
    }
}
//# sourceMappingURL=grpc-client.js.map