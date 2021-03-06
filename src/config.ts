import { injectable, inject } from 'inversify';
import * as minimist from 'minimist';

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
    description: 'Disable the HTTP Server',
    env: 'DISABLE_HTTP',
    args: ['disable_http'],
    dest: 'disableHTTP',
    value: false
  }, {
    description: 'Port on which the HTTP server runs',
    env: 'HTTP_PORT',
    args: ['h', 'http_port'],
    dest: 'httpPort',
    value: 8000
  }, {
    description: 'Disable the GRPC Server',
    env: 'DISABLE_GRPC',
    args: ['disable_grpc'],
    dest: 'disableGRPC',
    value: false
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
  }, {
    description: 'Debug mode flag',
    env: 'DEBUG',
    args: ['debug'],
    dest: 'debug',
    value: false
  }, {
    description: 'Logger options',
    dest: 'loggerOptions',
    value: {}
  }, {
    description: 'Sentry DSN',
    env: 'SENTRY_DSN',
    dest: 'sentryDsn',
    value: undefined
  }
  ];

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

      // set default value (if any)
      this.set(option.dest, option.value);

      // Check for commandline arguments
      if (option.args) {
        const value = option.args
          .map((key: string): minimist.ParsedArgs | undefined => args[key])
          .find(x => x !== undefined);
        this.set(option.dest, value);
        if (value !== undefined) {
          break;
        }
      }

      // Check for environment variables
      if (option.env) {
        this.set(option.dest, process.env[option.env]);
      }
    };
  }

  get(key: string): any | undefined {
    return (<any>this)[key];
  }

  set(key: string, value: any | undefined): void {
    if (value !== undefined) {
      (<any>this)[key] = value;
    }
  }
}
