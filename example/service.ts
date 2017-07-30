import 'reflect-metadata';

import * as path from 'path';
import { RService } from './../src';

import { HelloService } from './services';
import { HelloManager } from './managers';

const service = new RService({
  proto: {
    path: path.resolve('./proto/hello.proto'),
    package: 'hellopb',
    service: 'HelloService'
  },
  name: 'HelloService',
  services: [
    HelloService
  ],
  managers: [
    HelloManager
  ]
});