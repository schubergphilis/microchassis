import { injectable, inject } from 'inversify';
import * as minimist from 'minimist';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface ConfigOption {
  description?: string;
  env?: string;
  args?: Array<string>;
  dest: string;
  value: any;
}

@injectable()
export class Config {
  private knownOptions: Array<ConfigOption> = [{
    description: 'Global Log level',
    env: 'LOG_LEVEL',
    args: ['l', 'log_level'],
    dest: 'logLevel',
    value: 'info'
  }, {
    description: 'Port on which the HTTP server runs',
    env: 'HTTP_PORT',
    args: ['h', 'http_port'],
    dest: 'httpPort',
    value: 8000
  }, {
    description: 'Port on which the GRPC server runs',
    env: 'GRPC_PORT',
    args: ['g', 'grpc_port'],
    dest: 'grpcPort',
    value: 9000
  }, {
    description: 'Http server root url, used to prefix all the urls',
    env: 'HTTP_ROOT',
    args: ['http_root'],
    dest: 'httpRoot',
    value: undefined
  }, {
    description: 'GRPC client timeout',
    env: 'GRPC_CLIENT_TIMEOUT',
    dest: 'grpcClientTimeout',
    value: 5
  }, {
    description: 'Healthcheck url',
    dest: 'healthCheckURL',
    value: 'check'
  }, {
    description: 'Database name',
    env: 'DB_NAME',
    args: ['db'],
    dest: 'dbName',
    value: undefined
  }, {
    description: 'Database username',
    env: 'DB_USER',
    args: ['db_user'],
    dest: 'dbUser',
    value: undefined
  }, {
    description: 'Database password',
    env: 'DB_PASSWORD',
    args: ['db_password'],
    dest: 'dbPassword',
    value: ''
  }, {
    description: 'Database host',
    env: 'DB_HOST',
    args: ['db_host'],
    dest: 'dbHost',
    value: 'localhost'
  }, {
    description: 'Database port',
    env: 'DB_PORT',
    args: ['db_port'],
    dest: 'dbPort',
    value: 3306
  }];

  constructor(@inject('configoptions') configOptions?: Array<ConfigOption>) {
    // Merge config options
    if (configOptions) {
      this.knownOptions = this.knownOptions.concat(configOptions);
    }

    // Get commandline arguments
    const args = minimist(process.argv.slice(2));

    // Loop the options and put them on the config
    for (let i = 0, len = this.knownOptions.length; i < len; i++) {
      const option = this.knownOptions[i];

      this[option.dest] = option.value;

      // Check for commandline arguments
      if (option.args) {
        let argValue;

        for (let j = 0, lenJ = option.args.length; j < lenJ; j++) {
          const value = args[option.args[j]];
          if (value) {
            argValue = value;
            this[option.dest] = value;
            break;
          }
        }

        if (argValue) {
          this[option.dest] = argValue;
          break;
        }
      }

      // Check for environment variables
      if (option.env && process.env[option.env]) {
        this[option.dest] = process.env[option.env];
      }
    };
  }
}
