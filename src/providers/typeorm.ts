import { createConnection, getConnectionManager, Connection, ConnectionOptions, EntityManager } from 'typeorm';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { injectable } from 'inversify';
import * as deepmerge from 'deepmerge';

import { Config, HealthManager, Logger } from '../';

@injectable()
export class TypeORMProvider {
  public connection: Connection;
  public entityManager: EntityManager;
  public health = new BehaviorSubject(false);

  public defaultConnectionOptions = {
    driver: {
      type: 'mysql'
    },
    autoSchemaSync: false
  };

  private connectionOptions: ConnectionOptions;
  private entities = [];
  private checkInterval = 5000;
  private reconnectTime = 3000;

  // Static method to pass options, will be deep merged with the default options
  static setConnectionOptions(options: any) {
    TypeORMProvider.prototype.connectionOptions = options;
    return TypeORMProvider;
  }

  constructor(private config: Config, private healthManager: HealthManager, private logger: Logger) {
    healthManager.registerCheck('DB connection', this.health);

    const options = deepmerge(this.defaultConnectionOptions, this.connectionOptions);
    options.driver.username = this.config['dbUser'];
    options.driver.password = this.config['dbPassword'] || '';
    options.driver.database = this.config['dbName'];
    options.driver.host     = this.config['dbHost'];
    options.driver.port     = this.config['dbPort'];

    // We dont support autoschema sync, because we want to have auto retrying connection
    // we need to use connectionManager.create which doesn't support auto schema sync
    if (options['autoSchemaSync'] === true) {
      throw new Error('TypeORMProvider: autoSchemaSync not supported');
    }

    const connectionManager = getConnectionManager();
    this.connection = connectionManager.create(options);
    this.entityManager = this.connection.entityManager;
    this.connect();
  }

  private connect() {
    this.connection.connect()
      .then(() => {
        this.health.next(true);
        this.monitorHealth();
      })
      .catch((error) => {
        this.logger.error(`Failed to connect to database, retrying in: ${this.reconnectTime}ms`);
        this.logger.error(error);

        setTimeout(() => {
          this.connect();
        }, this.reconnectTime);
      });
  }

  // Monitors database connection and will update the health accordingly
  private monitorHealth() {
    setInterval(() => {
      this.entityManager.query('SELECT 1;')
        .then(() => {
          this.health.next(true);
        })
        .catch((error) => {
          this.health.next(false);
          this.logger.error(error);
        });
    }, this.checkInterval);
  }
}
