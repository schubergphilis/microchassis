import { inject, injectable } from 'inversify';
import { Config } from './../config';

export interface Subscriber {
  notify(event: Event): void;
}

export interface Event {
  [s: string]: any;
  _meta: {
    eventType: string;
    timestamp: string;
    producedBy: string;
  }
}

@injectable()
export class EventEmitter {
  constructor(@inject('event-subscribers') private subscribers: Array<Subscriber>) {}

  public emit(eventName: string, payload: { [s: string]: any } = {}) {
    // Using setImmediate to postpone actual execution until the api call has finished
    setImmediate(() => {
      payload._meta = {
        eventType: eventName,
        timestamp: new Date().toISOString(),
        producedBy: 'TODO TODO TODO'
      }

      for (const subscriber of this.subscribers) {
        subscriber.notify(<Event>payload);
      }
    });
  }
}
