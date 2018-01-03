import 'reflect-metadata';

import * as path from 'path';
import { RService } from './../src';

import { HelloService, IndirectHelloService, RandomErrorService } from './services';
import { HelloManager } from './managers';
import { GRPCClient } from './providers/grpc-client';
import { Subscriber, KinesisProducer } from './../src/events';

const service = new RService({
  proto: {
    path: path.resolve('./proto/hello.proto'),
    package: 'hellopb',
    service: 'HelloService'
  },
  services: [
    HelloService,
    IndirectHelloService,
    RandomErrorService,
  ],
  providers: [
    GRPCClient
  ],
  managers: [
    HelloManager
  ],
  config: [
    {
      dest: 'httpRoot',
      value: ''
    }
  ],
  events: {
    subscribers: [
      KinesisProducer
    ]
  }
});
