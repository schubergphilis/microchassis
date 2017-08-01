import { createConnection, Connection, ConnectionOptions, EntityManager } from 'typeorm';
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

    this.connect(options);
  }

  private connect(options: ConnectionOptions) {
    createConnection(options)
      .then((connection: Connection) => {
        this.connection = connection;
        this.entityManager = connection.entityManager;

        // We are healthy start monitoring health
        this.health.next(true);
        this.monitorHealth();

        return connection;
      })
      .catch(error => {
        this.logger.error(`Failed to connect to database, retrying in: ${this.reconnectTime}ms`);
        this.logger.error(JSON.stringify(error));

        setTimeout(() => {
          this.connect(options);
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
          this.logger.error(JSON.stringify(error));
        });
    }, this.checkInterval);
  }
}
