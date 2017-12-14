import * as ajv from 'ajv';
import { injectable } from 'inversify';

import { Context } from './context';
import { Logger } from './logger';
import { ValidationError, MicroChassisError } from './errors';

const schemaCompiler = new ajv({ allErrors: true });

/**
 * Http method mapping
 */
export type HttpMethod = 'GET' | 'PUT' | 'POST' | 'PATCH' | 'DELETE';
export const HTTP_METHOD: Record<HttpMethod, HttpMethod> = {
  POST: 'POST',
  GET: 'GET',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE'
}

export type ServiceHandlerFunction<T = any> = (context: Context, request: any) => Promise<ServiceResponse<T> | MicroChassisError | void>;

/**
 * Response of the handler of a service
 * @type ServiceResponse
 * @property status {number}
 * @property content {any}
 */
export interface ServiceResponse<T = any> {
  status?: number;
  content?: T;
  headers?: { [key: string]: string | Array<string> };
}

/**
 * Query string mapping, key is the query string property,
 * value is the path to which to map it.
 * @type QueryMapping
 */
export interface QueryMapping {
  [s: string]: string;
}

/**
 * Url mapping, key is the url string property,
 * value is the path to which to map it.
 * @type QueryMapping
 */
export interface UrlMapping {
  [s: string]: string;
}

/**
 * Service definition
 * @interface Service
 */
export interface Service {
  /**
   * RPC service name corresponds with the name of the method in the proto
   */
  grpcMethod: string;

  /**
   * REST method under which the service is available.
   * @default GET
   * @property method {HttpMethod}
   */
  method: HttpMethod;

  /**
   * REST endpoint on which the service will be exposed
   * @property url {string}
   */
  url: string;

  /**
   * Flag to disable checking of authorization header for an token
   */
  unauthenticated?: boolean;

  /**
   *  Maps query string parameters to request object
   *  @property queryMapping {QueryMapping}
   */
  queryMapping?: QueryMapping;

  /**
   * Maps url parameters to the reuest object
   */
  urlMapping?: UrlMapping;

  /**
   * Handles the actual request
   */
  handler: ServiceHandlerFunction;
}

// Generic URL mapping type
// tslint:disable-next-line
export type TRequestMapping<T> = {
  [s: string]: keyof T;
};


@injectable()
export abstract class BaseService<TRequest, TResponse> implements Service {
  public abstract url: string;
  public abstract method: HttpMethod;
  public grpcMethod: string;

  // JSON Schema that is used for validation of request
  protected abstract schema: Object;
  protected schemaValidator: ajv.ValidateFunction;
  public urlMapping: TRequestMapping<TRequest> = {};
  public queryMapping: TRequestMapping<TRequest> = {};

  protected abstract handleError(error: Error): ServiceResponse<TResponse>
  protected abstract async authorize(context: Context, request: TRequest): Promise<TResponse>


  constructor(protected logger: Logger) { }

  // Validates request against Service's JSON schema.
  protected async validate(_: Context, request: TRequest): Promise<boolean> {
    if (this.schemaValidator === undefined) {
      this.schemaValidator = schemaCompiler.compile(this.schema);
    }

    if (!this.schemaValidator(request)) {
      this.logger.debug(`Could not validate request: ${schemaCompiler.errorsText()}`);
      return false;
    }

    return true;
  }

  public async handler(context: Context, request: TRequest): Promise<ServiceResponse<TResponse>> {
    try {
      await this.authorize(context, request);
      if (!await this.validate(context, request)) {
        throw new ValidationError('Bad request');
      }
      return await this.handle(context, request);
    } catch (e) {
      return this.handleError(e);
    }
  }

  // Override this method to implement the actual service handler
  protected abstract async handle(context: Context, request: TRequest): Promise<ServiceResponse<TResponse>>;
}
