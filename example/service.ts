import 'reflect-metadata';

import * as path from 'path';
import { RService } from './../src';

import { HelloService } from './services';
import { HelloManager } from './managers';
import { Subscriber, KinesisProducer } from './../src/events';

new RService({
  proto: {
    path: path.resolve('./proto/hello.proto'),
    package: 'hellopb',
    service: 'HelloService'
  },
  services: [
    HelloService
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
