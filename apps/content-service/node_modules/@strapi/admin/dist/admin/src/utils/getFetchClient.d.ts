import type { errors } from '@strapi/utils';
export type ApiError = errors.ApplicationError | errors.ForbiddenError | errors.NotFoundError | errors.NotImplementedError | errors.PaginationError | errors.PayloadTooLargeError | errors.PolicyError | errors.RateLimitError | errors.UnauthorizedError | errors.ValidationError | errors.YupValidationError;
type FetchResponse<TData = any> = {
    data: TData;
    status?: number;
};
type FetchOptions = {
    params?: any;
    signal?: AbortSignal;
    headers?: Record<string, string>;
    validateStatus?: ((status: number) => boolean) | null;
};
type FetchConfig = {
    signal?: AbortSignal;
};
interface ErrorResponse {
    data: {
        data?: any;
        error: ApiError & {
            status?: number;
        };
    };
}
declare class FetchError extends Error {
    name: string;
    message: string;
    response?: ErrorResponse;
    code?: number;
    status?: number;
    constructor(message: string, response?: ErrorResponse);
}
declare const isFetchError: (error: unknown) => error is FetchError;
type FetchClient = {
    get: <TData = any>(url: string, config?: FetchOptions) => Promise<FetchResponse<TData>>;
    put: <TData = any, TSend = any>(url: string, data?: TSend, config?: FetchOptions) => Promise<FetchResponse<TData>>;
    post: <TData = any, TSend = any>(url: string, data?: TSend, config?: FetchOptions) => Promise<FetchResponse<TData>>;
    del: <TData = any>(url: string, config?: FetchOptions) => Promise<FetchResponse<TData>>;
};
/**
 * @public
 * @param {FetchConfig} [defaultOptions={}] - Fetch Configs.
 * @returns {FetchClient} A fetch client object with methods for making HTTP requests.
 * @description This is an abstraction around the native fetch exposed by a function. It provides a simple interface to handle API calls
 * to the Strapi backend.
 * @example
 * ```tsx
 * import { getFetchClient } from '@strapi/admin/admin';
 *
 * const myFunct = () => {
 *   const { get } = getFetchClient();
 *   const requestURL = "/some-endpoint";
 *
 *   const { data } = await get(requestURL);
 *
 *   return data;
 * };
 * ```
 */
declare const getFetchClient: (defaultOptions?: FetchConfig) => FetchClient;
export { getFetchClient, isFetchError, FetchError };
export type { FetchOptions, FetchResponse, FetchConfig, FetchClient, ErrorResponse };
