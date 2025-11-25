'use strict';

var rateLimit = require('./rateLimit.js');

var middlewares;
var hasRequiredMiddlewares;
function requireMiddlewares() {
    if (hasRequiredMiddlewares) return middlewares;
    hasRequiredMiddlewares = 1;
    const rateLimit$1 = rateLimit.__require();
    middlewares = {
        rateLimit: rateLimit$1
    };
    return middlewares;
}

exports.__require = requireMiddlewares;
//# sourceMappingURL=index.js.map
