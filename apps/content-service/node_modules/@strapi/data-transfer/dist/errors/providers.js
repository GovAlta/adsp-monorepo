'use strict';

var base = require('./base.js');
var constants = require('./constants.js');

class ProviderError extends base.DataTransferError {
    constructor(severity, message, details){
        super('provider', severity, message, details);
    }
}
class ProviderInitializationError extends ProviderError {
    constructor(message){
        super(constants.SeverityKind.FATAL, message, {
            step: 'initialization'
        });
    }
}
// TODO: these types are not working correctly, ProviderTransferError() is accepting any details object rather than requiring T
class ProviderValidationError extends ProviderError {
    constructor(message, details){
        super(constants.SeverityKind.SILLY, message, {
            step: 'validation',
            details
        });
    }
}
// TODO: these types are not working correctly, ProviderTransferError() is accepting any details object rather than requiring T
class ProviderTransferError extends ProviderError {
    constructor(message, details){
        super(constants.SeverityKind.FATAL, message, {
            step: 'transfer',
            details
        });
    }
}

exports.ProviderError = ProviderError;
exports.ProviderInitializationError = ProviderInitializationError;
exports.ProviderTransferError = ProviderTransferError;
exports.ProviderValidationError = ProviderValidationError;
//# sourceMappingURL=providers.js.map
