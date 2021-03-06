import { Connection, ConnectionOptions, EntityManager } from 'typeorm';
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';
import { injectable } from 'inversify';
import * as deepmerge from 'deepmerge';

import { Config, HealthManager, Logger } from '../..';
import { DbProvider, EntityProvider } from '..';

@injectable()
export class MariadbProvider extends DbProvider implements EntityProvider {
  protected connectionOptions: ConnectionOptions = {
    type: 'mariadb',
    timezone: 'Z',
    synchronize: false,
    logging: ['schema', 'error', 'warn', 'migration']
  };

  public readonly entities!: Array<Function>;
  public connection!: Connection;

  constructor(
    protected config: Config,
    protected healthManager: HealthManager,
    protected logger: Logger,
  ) {
    super(healthManager);

    const providedOptions: Partial<MysqlConnectionOptions> = {
      username: this.config.get('dbUser') as string,
      password: this.config.get('dbPassword') as string || '',
      database: this.config.get('dbName') as string,
      host: this.config.get('dbHost') as string,
      port: this.config.get('dbPort') as number,
      entities: this.entities
    };
    const options: ConnectionOptions = deepmerge(this.connectionOptions, providedOptions);
    this.connect(options);
  }

  public get entityManager(): EntityManager {
    return this.connection.manager;
  }
}
