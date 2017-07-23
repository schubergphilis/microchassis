import { Context } from './context';
/**
 * Http method mapping
 */
export declare const HttpMethod: {
    POST: "POST";
    GET: "GET";
    PATCH: "PATCH";
    DELETE: "DELETE";
};
/**
 * Query string mapping, key is the query string property,
 * value is the path to which to map it.
 * @type QueryMapping
 */
export declare type QueryMapping = {
    [s: string]: string;
};
/**
 * Url mapping, key is the url string property,
 * value is the path to which to map it.
 * @type QueryMapping
 */
export declare type UrlMapping = {
    [s: string]: string;
};
/**
 * Service callback function interface
 * @type ServiceCallback
 */
export declare type ServiceCallback = (error: any, response: any) => void;
/**
 * Service definition
 * @interface Service
 */
export interface Service {
    /**
     * REST method under which the service is available.
     * @default get
     * @property method {string}
     */
    method?: keyof typeof HttpMethod;
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
    handler: (context: Context, request: any, callback: ServiceCallback) => void;
}
