import { SeverityKind } from '../errors/constants.mjs';
import { DataTransferError } from '../errors/base.mjs';

class TransferEngineError extends DataTransferError {
    constructor(severity, message, details){
        super('engine', severity, message, details);
    }
}
class TransferEngineInitializationError extends TransferEngineError {
    constructor(message){
        super(SeverityKind.FATAL, message, {
            step: 'initialization'
        });
    }
}
class TransferEngineValidationError extends TransferEngineError {
    constructor(message, details){
        super(SeverityKind.FATAL, message, {
            step: 'validation',
            details
        });
    }
}
class TransferEngineTransferError extends TransferEngineError {
    constructor(message, details){
        super(SeverityKind.FATAL, message, {
            step: 'transfer',
            details
        });
    }
}

export { TransferEngineError, TransferEngineInitializationError, TransferEngineTransferError, TransferEngineValidationError };
//# sourceMappingURL=errors.mjs.map
