import { injectable } from 'inversify';

@injectable()
export class HealthManager {
  constructor() {
    console.log('HealthManager initialized');
  }
}