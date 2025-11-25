'use strict';

var fp = require('lodash/fp');
var errors = require('../errors.js');

const reject = (reason)=>{
    throw new errors.TransferEngineValidationError(`Invalid provider supplied. ${reason}`);
};
const validateProvider = (type, provider)=>{
    if (!provider) {
        return reject(`Expected an instance of "${fp.capitalize(type)}Provider", but got "${typeof provider}" instead.`);
    }
    if (provider.type !== type) {
        return reject(`Expected the provider to be of type "${type}" but got "${provider.type}" instead.`);
    }
};

exports.validateProvider = validateProvider;
//# sourceMappingURL=provider.js.map
