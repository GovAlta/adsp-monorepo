import { IntlFormatters } from 'react-intl';
import { FetchError, ApiError } from '../utils/getFetchClient';
import { NormalizeErrorOptions } from '../utils/normalizeAPIError';
interface UnknownApiError {
    /**
     * The name of the ApiError, is always a static value.
     */
    name: 'UnknownError';
    /**
     * The error message.
     */
    message: string;
    /**
     * The error details.
     */
    details?: unknown;
    /**
     * The HTTP status code of the error.
     */
    status?: number;
}
/**
 * The last item is the fallback error SerializedError which
 * typically comes from redux-toolkit itself.
 */
interface SerializedError {
    /**
     * The name of the error.
     */
    name?: string;
    /**
     * The error message that explains what went wrong.
     */
    message?: string;
    /**
     * The stack trace of the error.
     */
    stack?: string;
    /**
     * A specific error code associated with the error.
     */
    code?: string;
}
/**
 * These are the types or errors we return
 * from the redux-toolkit data-fetching setup.
 */
type BaseQueryError = ApiError | UnknownApiError | SerializedError;
/**
 * @public
 * @description The purpose of this hook is to offer a unified way to handle errors thrown by API endpoints, regardless of the type of error (`ValidationError`, `ApplicationErrror` ...)
that has been thrown.
 * @example
 * ```tsx
 * import * as React from 'react';
 * import { useFetchClient, useAPIErrorHandler, useNotification } from '@strapi/admin/admin';
 *
 * const MyComponent = () => {
 *   const { get } = useFetchClient();
 *   const { formatAPIError } = useAPIErrorHandler(getTrad);
 *   const { toggleNotification } = useNotification();
 *
 *   const handleDeleteItem = async () => {
 *     try {
 *       return await get('/admin');
 *     } catch (error) {
 *       toggleNotification({
 *         type: 'danger',
 *         message: formatAPIError(error),
 *       });
 *     }
 *   };
 *   return <button onClick={handleDeleteItem}>Delete item</button>;
 * };
 * ```
 */
export declare function useAPIErrorHandler(intlMessagePrefixCallback?: FormatAPIErrorOptions['intlMessagePrefixCallback']): {
    /**
     * @alpha
     * Convert ValidationErrors from the API into an object that can be used by forms.
     */
    _unstableFormatValidationErrors: (error: Extract<BaseQueryError, {
        name: 'ValidationError';
    }>) => Record<string, string>;
    /**
     * @alpha
     * This handles the errors given from `redux-toolkit`'s axios based baseQuery function.
     */
    _unstableFormatAPIError: (error: BaseQueryError) => string;
    formatAPIError: (error: FetchError) => string;
};
type FormatAPIErrorOptions = Partial<Pick<NormalizeErrorOptions, 'intlMessagePrefixCallback'>> & Pick<IntlFormatters, 'formatMessage'>;
export type { ApiError };
