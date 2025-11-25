'use strict';

var constants = require('../errors/constants.js');
var base = require('../errors/base.js');

class TransferEngineError extends base.DataTransferError {
    constructor(severity, message, details){
        super('engine', severity, message, details);
    }
}
class TransferEngineInitializationError extends TransferEngineError {
    constructor(message){
        super(constants.SeverityKind.FATAL, message, {
            step: 'initialization'
        });
    }
}
class TransferEngineValidationError extends TransferEngineError {
    constructor(message, details){
        super(constants.SeverityKind.FATAL, message, {
            step: 'validation',
            details
        });
    }
}
class TransferEngineTransferError extends TransferEngineError {
    constructor(message, details){
        super(constants.SeverityKind.FATAL, message, {
            step: 'transfer',
            details
        });
    }
}

exports.TransferEngineError = TransferEngineError;
exports.TransferEngineInitializationError = TransferEngineInitializationError;
exports.TransferEngineTransferError = TransferEngineTransferError;
exports.TransferEngineValidationError = TransferEngineValidationError;
//# sourceMappingURL=errors.js.map
