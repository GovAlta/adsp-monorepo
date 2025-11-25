'use strict';

/**
 * Prefix message with 'apiError.'
 */ function getPrefixedId(message, callback) {
    const prefixedMessage = `apiError.${message}`;
    // if a prefix function has been passed in it is used to
    // prefix the id, e.g. to allow an error message to be
    // set only for a localization namespace
    if (typeof callback === 'function') {
        return callback(prefixedMessage);
    }
    return prefixedMessage;
}

exports.getPrefixedId = getPrefixedId;
//# sourceMappingURL=getPrefixedId.js.map
