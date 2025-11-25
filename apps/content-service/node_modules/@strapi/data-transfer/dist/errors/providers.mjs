import { DataTransferError } from './base.mjs';
import { SeverityKind } from './constants.mjs';

class ProviderError extends DataTransferError {
    constructor(severity, message, details){
        super('provider', severity, message, details);
    }
}
class ProviderInitializationError extends ProviderError {
    constructor(message){
        super(SeverityKind.FATAL, message, {
            step: 'initialization'
        });
    }
}
// TODO: these types are not working correctly, ProviderTransferError() is accepting any details object rather than requiring T
class ProviderValidationError extends ProviderError {
    constructor(message, details){
        super(SeverityKind.SILLY, message, {
            step: 'validation',
            details
        });
    }
}
// TODO: these types are not working correctly, ProviderTransferError() is accepting any details object rather than requiring T
class ProviderTransferError extends ProviderError {
    constructor(message, details){
        super(SeverityKind.FATAL, message, {
            step: 'transfer',
            details
        });
    }
}

export { ProviderError, ProviderInitializationError, ProviderTransferError, ProviderValidationError };
//# sourceMappingURL=providers.mjs.map
