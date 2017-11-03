import { getConnectionManager, Connection, ConnectionOptions, EntityManager, ObjectLiteral } from 'typeorm';
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { injectable } from 'inversify';
import * as deepmerge from 'deepmerge';

import { Config, HealthManager, Logger } from '../';

export abstract class DbProvider {
  public abstract readonly entityManager: EntityManager;
  public abstract readonly entities: Array<ObjectLiteral>;
  public abstract connection: Connection;
  public readonly health: BehaviorSubject<boolean>;

  protected abstract logger: Logger;
  protected abstract config: Config;
  protected abstract connectionOptions: ConnectionOptions;
  protected healthManager: HealthManager;

  protected reconnectTime = 3000;
  protected checkInterval = 5000;

  constructor() {
    this.health = new BehaviorSubject(false);
    this.healthManager.registerCheck('DB connection', this.health);
  }

  protected connect(options: ConnectionOptions): void {
    // We dont support autoschema sync, because we want to have auto retrying connection
    // we need to use connectionManager.create which doesn't support auto schema sync
    if (options.synchronize === true) {
      throw new Error('DbProvider: synchronize option is explicitely forbidden');
    }

    const connectionManager = getConnectionManager();
    this.connection = connectionManager.create(options);
    this.connection
      .connect()
      .then(() => {
        this.health.next(true);
        this.monitorHealth();
      })
      .catch((error: Error) => {
        this.logger.exception(error, 'Failed to connect to db, retrying in: ${this.reconnectTime}ms');
        setTimeout(
          () => { this.connect(options); },
          this.reconnectTime);
      });
  }

  // Monitors database connection and will update the health accordingly
  protected monitorHealth(): void {
    setInterval(() => {
      this.connection.manager.query('SELECT 1;')
        .then(() => {
          this.health.next(true);
        })
        .catch((error: Error) => {
          this.health.next(false);
          this.logger.exception(error, 'Health check query failed');
        });
    }, this.checkInterval);
  }

}

export interface EntityProvider {
  readonly entities: Array<Function>;
}

export interface EntityProviderT {
  new(...args: any[]): EntityProvider;
};

export function ProvidesEntities<T extends EntityProviderT>(Base: T, entities: Array<Function>) {
  return class extends Base {
    public entities = entities;
  }
}
@injectable()
export class MariadbProvider extends DbProvider implements EntityProvider {
  protected connectionOptions: ConnectionOptions = {
    type: 'mariadb',
    timezone: 'Z',
    synchronize: false,
    logging: ['schema', 'error', 'warn', 'migration']
  };

  public readonly entities: Array<Function>;
  public connection: Connection;

  constructor(
    protected config: Config,
    protected healthManager: HealthManager,
    protected logger: Logger,
  ) {
    super();

    const providedOptions: Partial<MysqlConnectionOptions> = {
      username: this.config['dbUser'],
      password: this.config['dbPassword'] || '',
      database: this.config['dbName'],
      host: this.config['dbHost'],
      port: this.config['dbPort'],
      entities: this.entities
    };
    const options: ConnectionOptions = deepmerge(this.connectionOptions, providedOptions);
    this.connect(options);
  }

  public get entityManager(): EntityManager {
    return this.connection.manager;
  }
}
