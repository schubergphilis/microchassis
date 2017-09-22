import { injectable } from 'inversify';
import { EventEmitter } from './../../src/events';

@injectable()
export class HelloManager {
  constructor(private eventEmitter: EventEmitter) {}

  public hello(name: string) {
    this.eventEmitter.emit('hello', { name });

    return `Hello ${name || 'stranger'}`;
  }
}
