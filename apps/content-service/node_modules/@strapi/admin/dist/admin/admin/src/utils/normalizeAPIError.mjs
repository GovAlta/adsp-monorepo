import { getPrefixedId } from './getPrefixedId.mjs';

function normalizeError(error, { name, intlMessagePrefixCallback }) {
    const { message } = error;
    const normalizedError = {
        id: getPrefixedId(message, intlMessagePrefixCallback),
        defaultMessage: message,
        name: error.name ?? name,
        values: {}
    };
    if ('path' in error) {
        normalizedError.values = {
            path: error.path.join('.')
        };
    }
    return normalizedError;
}
const validateErrorIsYupValidationError = (err)=>typeof err.details === 'object' && err.details !== null && 'errors' in err.details;
/**
 * Normalize the format of `ResponseError`
 * in places where the hook `useAPIErrorHandler` can not called
 * (e.g. outside of a React component).
 */ function normalizeAPIError(apiError, intlMessagePrefixCallback) {
    const error = apiError.response?.data?.error;
    if (error) {
        // some errors carry multiple errors (such as ValidationError)
        if (validateErrorIsYupValidationError(error)) {
            return {
                name: error.name,
                message: error?.message || null,
                errors: error.details.errors.map((err)=>normalizeError(err, {
                        name: error.name,
                        intlMessagePrefixCallback
                    }))
            };
        }
        return normalizeError(error, {
            intlMessagePrefixCallback
        });
    }
    return null;
}

export { normalizeAPIError };
//# sourceMappingURL=normalizeAPIError.mjs.map
