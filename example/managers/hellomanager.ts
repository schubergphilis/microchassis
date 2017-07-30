import { injectable } from 'inversify';

@injectable()
export class HelloManager {
  public hello(name: string) {
    return `Hello ${name || 'stranger'}`;
  }
}