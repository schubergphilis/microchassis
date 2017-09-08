import { injectable } from 'inversify';
import { EventEmitter } from './../../src/events';

@injectable()
export class HelloManager {
  constructor(private eventEmitter: EventEmitter) {

  }

  public hello(name: string) {
    this.eventEmitter.emit('foobar', {
      foo: 'bar'
    });

    return `Hello ${name || 'stranger'}`;
  }
}
