import { SerializedError } from '@reduxjs/toolkit';
import { type UnknownApiError, type ApiError } from '@strapi/admin/strapi-admin';
export type BaseQueryError = ApiError | UnknownApiError | SerializedError;
declare const isBaseQueryError: (error: BaseQueryError) => error is ApiError | UnknownApiError;
interface Query {
    plugins?: Record<string, unknown>;
    _q?: string;
    [key: string]: any;
}
/**
 * This type extracts the plugin options from the query
 * and appends them to the root of the query
 */
type TransformedQuery<TQuery extends Query> = Omit<TQuery, 'plugins'> & {
    [key: string]: string;
};
/**
 * @description
 * Creates a valid query params object for get requests
 * ie. plugins[18n][locale]=en becomes locale=en
 */
declare const buildValidParams: <TQuery extends Query>(query: TQuery) => TransformedQuery<TQuery>;
export { isBaseQueryError, buildValidParams };
