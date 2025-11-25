import yup from 'yup';
import { HttpError } from 'http-errors';
declare class ApplicationError<TName extends string = 'ApplicationError', TMessage extends string = string, TDetails = unknown> extends Error {
    name: TName;
    details: TDetails;
    message: TMessage;
    constructor(message?: TMessage, details?: TDetails);
}
declare class ValidationError<TMessage extends string = string, TDetails = unknown> extends ApplicationError<'ValidationError', TMessage, TDetails> {
    constructor(message: TMessage, details?: TDetails);
}
interface YupFormattedError {
    path: string[];
    message: string;
    name: string;
    value: string;
}
declare class YupValidationError<TMessage extends string = string> extends ValidationError<TMessage, {
    errors: YupFormattedError[];
}> {
    constructor(yupError: yup.ValidationError, message?: TMessage);
}
declare class PaginationError<TMessage extends string = string, TDetails = unknown> extends ApplicationError<'PaginationError', TMessage, TDetails> {
    constructor(message?: TMessage, details?: TDetails);
}
declare class NotFoundError<TMessage extends string = string, TDetails = unknown> extends ApplicationError<'NotFoundError', TMessage, TDetails> {
    constructor(message?: TMessage, details?: TDetails);
}
declare class ForbiddenError<TName extends string = 'ForbiddenError', TMessage extends string = string, TDetails = unknown> extends ApplicationError<TName, TMessage, TDetails> {
    constructor(message?: TMessage, details?: TDetails);
}
declare class UnauthorizedError<TMessage extends string = string, TDetails = unknown> extends ApplicationError<'UnauthorizedError', TMessage, TDetails> {
    constructor(message?: TMessage, details?: TDetails);
}
declare class RateLimitError<TMessage extends string = string, TDetails = unknown> extends ApplicationError<'RateLimitError', TMessage, TDetails> {
    constructor(message?: TMessage, details?: TDetails);
}
declare class PayloadTooLargeError<TMessage extends string = string, TDetails = unknown> extends ApplicationError<'PayloadTooLargeError', TMessage, TDetails> {
    constructor(message?: TMessage, details?: TDetails);
}
declare class PolicyError<TMessage extends string = string, TDetails = unknown> extends ForbiddenError<'PolicyError', TMessage, TDetails> {
    constructor(message?: TMessage, details?: TDetails);
}
declare class NotImplementedError<TMessage extends string = string, TDetails = unknown> extends ApplicationError<'NotImplementedError', TMessage, TDetails> {
    constructor(message?: TMessage, details?: TDetails);
}
export { HttpError, ApplicationError, ValidationError, YupValidationError, PaginationError, NotFoundError, ForbiddenError, UnauthorizedError, RateLimitError, PayloadTooLargeError, PolicyError, NotImplementedError, };
//# sourceMappingURL=errors.d.ts.map