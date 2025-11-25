'use strict';

var require$$0 = require('lodash/fp');

var utils;
var hasRequiredUtils;
function requireUtils() {
    if (hasRequiredUtils) return utils;
    hasRequiredUtils = 1;
    const { getOr } = require$$0;
    /**
	 * Throws an ApolloError if context body contains a bad request
	 * @param contextBody - body of the context object given to the resolver
	 * @throws ApolloError if the body is a bad request
	 */ function checkBadRequest(contextBody) {
        const statusCode = getOr(200, 'statusCode', contextBody);
        if (statusCode !== 200) {
            const errorMessage = getOr('Bad Request', 'error', contextBody);
            const exception = new Error(errorMessage);
            exception.code = statusCode || 400;
            exception.data = contextBody;
            throw exception;
        }
    }
    utils = {
        checkBadRequest
    };
    return utils;
}

exports.__require = requireUtils;
//# sourceMappingURL=utils.js.map
