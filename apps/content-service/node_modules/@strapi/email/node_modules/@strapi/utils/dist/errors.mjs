export { HttpError } from 'http-errors';
import { formatYupErrors } from './format-yup-error.mjs';

/* ApplicationError */ class ApplicationError extends Error {
    constructor(message = 'An application error occured', details = {}){
        super();
        this.name = 'ApplicationError';
        this.message = message;
        this.details = details;
    }
}
class ValidationError extends ApplicationError {
    constructor(message, details){
        super(message, details);
        this.name = 'ValidationError';
    }
}
class YupValidationError extends ValidationError {
    constructor(yupError, message){
        super('Validation');
        const { errors, message: yupMessage } = formatYupErrors(yupError);
        this.message = message || yupMessage;
        this.details = {
            errors
        };
    }
}
class PaginationError extends ApplicationError {
    constructor(message = 'Invalid pagination', details){
        super(message, details);
        this.name = 'PaginationError';
        this.message = message;
    }
}
class NotFoundError extends ApplicationError {
    constructor(message = 'Entity not found', details){
        super(message, details);
        this.name = 'NotFoundError';
        this.message = message;
    }
}
class ForbiddenError extends ApplicationError {
    constructor(message = 'Forbidden access', details){
        super(message, details);
        this.name = 'ForbiddenError';
        this.message = message;
    }
}
class UnauthorizedError extends ApplicationError {
    constructor(message = 'Unauthorized', details){
        super(message, details);
        this.name = 'UnauthorizedError';
        this.message = message;
    }
}
class RateLimitError extends ApplicationError {
    constructor(message = 'Too many requests, please try again later.', details){
        super(message, details);
        this.name = 'RateLimitError';
        this.message = message;
        this.details = details || {};
    }
}
class PayloadTooLargeError extends ApplicationError {
    constructor(message = 'Entity too large', details){
        super(message, details);
        this.name = 'PayloadTooLargeError';
        this.message = message;
    }
}
class PolicyError extends ForbiddenError {
    constructor(message = 'Policy Failed', details){
        super(message, details);
        this.name = 'PolicyError';
        this.message = message;
        this.details = details || {};
    }
}
class NotImplementedError extends ApplicationError {
    constructor(message = 'This feature is not implemented yet', details){
        super(message, details);
        this.name = 'NotImplementedError';
        this.message = message;
    }
}

export { ApplicationError, ForbiddenError, NotFoundError, NotImplementedError, PaginationError, PayloadTooLargeError, PolicyError, RateLimitError, UnauthorizedError, ValidationError, YupValidationError };
//# sourceMappingURL=errors.mjs.map
