import * as React from 'react';
import { useIntl } from 'react-intl';
import { getPrefixedId } from '../utils/getPrefixedId.mjs';
import { normalizeAPIError } from '../utils/normalizeAPIError.mjs';
import { setIn } from '../utils/objects.mjs';

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
 */ function useAPIErrorHandler(intlMessagePrefixCallback) {
    const { formatMessage } = useIntl();
    /**
   * @description This method try to normalize the passed error
   * and then call formatAPIError to stringify the ResponseObject
   * into a string. If it fails it will call formatFetchError and
   * return the error message.
   */ const formatError = React.useCallback((error)=>{
        // Try to normalize the passed error first. This will fail for e.g. network
        // errors which are thrown by fetchClient directly.
        try {
            const formattedErr = formatAPIError(error, {
                intlMessagePrefixCallback,
                formatMessage
            });
            if (!formattedErr) {
                return formatFetchError(error, {
                    intlMessagePrefixCallback,
                    formatMessage
                });
            }
            return formattedErr;
        } catch (_) {
            throw new Error('formatAPIError: Unknown error:', error);
        }
    }, [
        formatMessage,
        intlMessagePrefixCallback
    ]);
    return {
        /**
     * @alpha
     * Convert ValidationErrors from the API into an object that can be used by forms.
     */ _unstableFormatValidationErrors: React.useCallback((error)=>{
            if (typeof error.details === 'object' && error.details !== null) {
                if ('errors' in error.details && Array.isArray(error.details.errors)) {
                    const validationErrors = error.details.errors;
                    return validationErrors.reduce((acc, err)=>{
                        const { path, message } = err;
                        return setIn(acc, path.join('.'), message);
                    }, {});
                } else {
                    const details = error.details;
                    return Object.keys(details).reduce((acc, key)=>{
                        const messages = details[key];
                        return {
                            ...acc,
                            [key]: messages.join(', ')
                        };
                    }, {});
                }
            } else {
                return {};
            }
        }, []),
        /**
     * @alpha
     * This handles the errors given from `redux-toolkit`'s axios based baseQuery function.
     */ _unstableFormatAPIError: React.useCallback((error)=>{
            const err = {
                response: {
                    data: {
                        error
                    }
                }
            };
            /**
         * There's a chance with SerializedErrors that the message is not set.
         * In that case we return a generic error message.
         */ if (!error.message) {
                return 'Unknown error occured.';
            }
            return formatError(err);
        }, [
            formatError
        ]),
        formatAPIError: formatError
    };
}
function formatFetchError(error, { intlMessagePrefixCallback, formatMessage }) {
    const { code, message } = error;
    return formatMessage({
        id: getPrefixedId(message, intlMessagePrefixCallback),
        defaultMessage: message
    }, {
        code
    });
}
/**
 * @description This method stringifies the `ResponseObject` into
 * a string. If multiple errors are thrown by the API, which
 * happens e.g.in the case of a `ValidationError`, all errors
 * will bo concatenated into a single string.
 */ function formatAPIError(error, { formatMessage, intlMessagePrefixCallback }) {
    if (!formatMessage) {
        throw new Error('The formatMessage callback is a mandatory argument.');
    }
    const normalizedError = normalizeAPIError(error, intlMessagePrefixCallback);
    if (!normalizedError) {
        return null;
    }
    if ('message' in normalizedError && normalizedError.message !== null) {
        return normalizedError.message;
    }
    // stringify multiple errors
    if ('errors' in normalizedError) {
        return normalizedError.errors.map(({ id, defaultMessage, values })=>formatMessage({
                id,
                defaultMessage
            }, values)).join('\n');
    }
    return formatMessage(normalizedError);
}

export { useAPIErrorHandler };
//# sourceMappingURL=useAPIErrorHandler.mjs.map
