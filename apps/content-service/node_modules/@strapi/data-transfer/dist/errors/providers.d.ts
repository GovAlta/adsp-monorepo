import { ErrorCode } from '../../types';
import { DataTransferError } from './base';
import { Severity } from './constants';
type ProviderStep = 'initialization' | 'validation' | 'transfer';
export type ProviderErrorDetails<P extends ProviderStep = ProviderStep, U = never> = {
    step: P;
    code?: ErrorCode;
} & ([U] extends [never] ? unknown : {
    details?: U;
});
export declare class ProviderError<P extends ProviderStep = ProviderStep, U = never, T extends ProviderErrorDetails<P, U> = ProviderErrorDetails<P, U>> extends DataTransferError<T> {
    constructor(severity: Severity, message?: string, details?: T | null);
}
export declare class ProviderInitializationError extends ProviderError<'initialization'> {
    constructor(message?: string);
}
export declare class ProviderValidationError<T = ProviderErrorDetails> extends ProviderError<'validation', T> {
    constructor(message?: string, details?: T);
}
export declare class ProviderTransferError<T = ProviderErrorDetails> extends ProviderError<'transfer', T> {
    constructor(message?: string, details?: T);
}
export {};
//# sourceMappingURL=providers.d.ts.map