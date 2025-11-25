import { __require as requireRateLimit } from './rateLimit.mjs';

var middlewares;
var hasRequiredMiddlewares;
function requireMiddlewares() {
    if (hasRequiredMiddlewares) return middlewares;
    hasRequiredMiddlewares = 1;
    const rateLimit = requireRateLimit();
    middlewares = {
        rateLimit
    };
    return middlewares;
}

export { requireMiddlewares as __require };
//# sourceMappingURL=index.mjs.map
