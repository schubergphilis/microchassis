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
      type: 'mysql',
      host: 'localhost',
      port: 3306
    },
    autoSchemaSync: false
  };

  private connectionOptions: ConnectionOptions;
  private entities = [];
  private checkInterval = 5000;

  // Static method to pass options, will be deep merged with the default options
  static setConnectionOptions(options: any) {
    TypeORMProvider.prototype.connectionOptions = options;
    return TypeORMProvider;
  }

  constructor(private config: Config, private healthManager: HealthManager, private logger: Logger) {
    healthManager.registerCheck('DB connection', this.health);

    const options = deepmerge(this.defaultConnectionOptions, this.connectionOptions);
    options.driver.username = this.config['dbUser'];
    options.driver.password = this.config['dbPassword'];
    options.driver.database = this.config['dbName'];

    createConnection(this.connectionOptions)
      .then((connection: Connection) => {
        this.connection = connection;
        this.entityManager = connection.entityManager;

        // We are healthy start monitoring health
        this.health.next(true);
        this.monitorHealth();
      })
      .catch(error => {
        this.logger.error('Failed to connect to database');
      });
  }

  // Monitors database connection and will update the health accordingly
  private monitorHealth() {
    setInterval(() => {
      this.entityManager.query('SELECT 1;')
        .then(() => {
          this.health.next(true);
        })
        .catch(() => {
          this.health.next(false);
        });
    }, this.checkInterval);
  }
}
