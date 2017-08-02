import { Request, Response } from 'express';
import { injectable } from 'inversify';
import { Context } from './context';

/**
 * Http method mapping
 */
export const HttpMethod = {
  POST: 'post' as 'POST',
  GET: 'get' as 'GET',
  PUT: 'put' as 'PUT',
  PATCH: 'patch' as 'PATCH',
  DELETE: 'delete' as 'DELETE',
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
  handler: (context: Context, request: any) => Promise<any>;
}


