import { Context } from './context';

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

export type ServiceHandlerFunction = (context: Context, request: any) => Promise<ServiceResponse | void>;

/**
 * Response of the handler of a service
 * @type ServiceResponse
 * @property status {number}
 * @property content {any}
 */
export interface ServiceResponse {
  headers?: { [key: string]: string | Array<string> };
  status?: number;
  content?: any;
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


@injectable()
class Base { }

const BaseSafeService = ErrorHandlingServiceMixin(AuthorizedCoachServiceMixin(InjectableBase));

@injectable()
export abstract class SafeService<T, U extends ServiceResponse> extends BaseSafeService implements Service {
  public abstract url: string;
  public abstract method: keyof typeof HttpMethod;
  protected abstract circleClient: providers.CircleClient;
  protected abstract coachManager: managers.CoachManager;
  public urlMapping: UrlMapping<T>;

  public async handler(context: Context, request: any): Promise<ServiceResponse> {
    try {
      await this.authorize(context, request);
      return await this.handle(context, request as T);
    } catch (e) {
      return this.handleError(e);
    }
  }

  // Override this method to implement the actual service handler
  protected abstract async handle(context: Context, request: T): Promise<U>;
}
