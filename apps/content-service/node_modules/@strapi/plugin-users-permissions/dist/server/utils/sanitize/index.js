'use strict';

var index = require('./visitors/index.js');
var sanitizers = require('./sanitizers.js');

var sanitize;
var hasRequiredSanitize;
function requireSanitize() {
    if (hasRequiredSanitize) return sanitize;
    hasRequiredSanitize = 1;
    const visitors = index.__require();
    const sanitizers$1 = sanitizers.__require();
    sanitize = {
        sanitizers: sanitizers$1,
        visitors
    };
    return sanitize;
}

exports.__require = requireSanitize;
//# sourceMappingURL=index.js.map
