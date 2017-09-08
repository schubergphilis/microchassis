import 'reflect-metadata';

import * as path from 'path';
import { RService } from './../src';

import { HelloService } from './services';
import { HelloManager } from './managers';
import { Subscriber, KinesisProducer } from './../src/events';


import * as services from './services';

Object.keys(services).forEach((service) => {
  console.log(services[service]);
});


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
