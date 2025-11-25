import { SerializedError } from '@reduxjs/toolkit';
import { BaseQueryFn } from '@reduxjs/toolkit/query';
import { type FetchOptions, ApiError } from '../utils/getFetchClient';
interface QueryArguments {
    url: string;
    method?: 'GET' | 'POST' | 'DELETE' | 'PUT';
    data?: unknown;
    config?: FetchOptions;
}
interface UnknownApiError {
    name: 'UnknownError';
    message: string;
    details?: unknown;
    status?: number;
}
type BaseQueryError = ApiError | UnknownApiError;
declare const fetchBaseQuery: () => BaseQueryFn<string | QueryArguments, unknown, BaseQueryError>;
declare const isBaseQueryError: (error: BaseQueryError | SerializedError) => error is BaseQueryError;
export { fetchBaseQuery, isBaseQueryError };
export type { BaseQueryError, UnknownApiError, QueryArguments };
