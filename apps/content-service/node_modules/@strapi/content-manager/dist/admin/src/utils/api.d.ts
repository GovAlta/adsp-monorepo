import { SerializedError } from '@reduxjs/toolkit';
import { ApiError, type UnknownApiError } from '@strapi/admin/strapi-admin';
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
 * ie. plugins[i18n][locale]=en becomes locale=en
 */
declare const buildValidParams: <TQuery extends Query>(query: TQuery) => TransformedQuery<TQuery>;
type BaseQueryError = ApiError | UnknownApiError;
declare const isBaseQueryError: (error: BaseQueryError | SerializedError) => error is BaseQueryError;
export { isBaseQueryError, buildValidParams };
export type { BaseQueryError, UnknownApiError };
