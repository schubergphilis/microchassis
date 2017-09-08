import { injectable } from 'inversify';
import { Subscriber, Event } from './../event-emitter';

@injectable()
export class KinesisProducer implements Subscriber {
  public notify(event: Event) {
    console.log('sending to kinesis: ', event);
  }
}
