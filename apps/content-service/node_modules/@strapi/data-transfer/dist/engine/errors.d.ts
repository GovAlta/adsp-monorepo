import { DataTransferError, Severity } from '../errors';
type TransferEngineStep = 'initialization' | 'validation' | 'transfer';
type TransferEngineErrorDetails<P extends TransferEngineStep = TransferEngineStep, U = never> = {
    step: P;
} & ([U] extends [never] ? unknown : {
    details?: U;
});
declare class TransferEngineError<P extends TransferEngineStep = TransferEngineStep, U = never, T extends TransferEngineErrorDetails<P, U> = TransferEngineErrorDetails<P, U>> extends DataTransferError<T> {
    constructor(severity: Severity, message?: string, details?: T | null);
}
declare class TransferEngineInitializationError extends TransferEngineError<'initialization'> {
    constructor(message?: string);
}
declare class TransferEngineValidationError<T extends {
    check: string;
} = {
    check: string;
}> extends TransferEngineError<'validation', T> {
    constructor(message?: string, details?: T);
}
declare class TransferEngineTransferError<T extends {
    check: string;
} = {
    check: string;
}> extends TransferEngineError<'transfer', T> {
    constructor(message?: string, details?: T);
}
export { TransferEngineError, TransferEngineInitializationError, TransferEngineValidationError, TransferEngineTransferError, };
//# sourceMappingURL=errors.d.ts.map