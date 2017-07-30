import { injectable } from 'inversify';
import { Logger } from './logger';
import 'rxjs/add/operator/distinct';
import 'rxjs/add/operator/skip';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';


type HealthChecks = {
  [s: string]: BehaviorSubject<boolean>;
}

@injectable()
export class HealthManager {
  private checks: HealthChecks = {};
  private _health = false;
  private _previousHealth = false;

  constructor(private logger: Logger) {}

  public registerCheck(name: string, check) {
    if (this.checks[name]) {
      throw new Error(`Health check with name: ${name} already exists`);
    }

    this.logger.debug(`Registering new healthcheck: ${name}`);
    this.checks[name] = check;

    // Check the health
    this.determineHealth();

    // Skip the initial status no need to log that
    check
      .skip(1)
      .subscribe((status) => {
        if (status === false) {
          this.logger.warn(`Health check: ${name} became unhealthy`);
          this.healthy = false;
        } else {
          this.logger.info(`Health check: ${name} became healthy`);
          this.determineHealth();
        }
      });
  }

  get healthy() {
    return this._health;
  }

  set healthy(status: boolean) {
    if (status !== this._health) {
      this._health = status;
    
      if (status === false) {
        this.logger.warn('Service became unhealthy');
      } else {
        this.logger.info('Service became healthy');
      }
    }
  }

  get numberOfChecks() {
    return Object.keys(this.checks).length;
  }

  private determineHealth() {
    let status = true;
    const keys = Object.keys(this.checks);

    for (let i = 0, len = keys.length; i < len; i++) {
       const checkStatus = this.checks[keys[i]].getValue();
       if (checkStatus === false) {
         status = false;
         break;
       }
    }

    this.healthy = status;
  }
}