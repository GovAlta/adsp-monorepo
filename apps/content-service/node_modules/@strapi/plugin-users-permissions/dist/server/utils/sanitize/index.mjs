import { __require as requireVisitors } from './visitors/index.mjs';
import { __require as requireSanitizers } from './sanitizers.mjs';

var sanitize;
var hasRequiredSanitize;
function requireSanitize() {
    if (hasRequiredSanitize) return sanitize;
    hasRequiredSanitize = 1;
    const visitors = requireVisitors();
    const sanitizers = requireSanitizers();
    sanitize = {
        sanitizers,
        visitors
    };
    return sanitize;
}

export { requireSanitize as __require };
//# sourceMappingURL=index.mjs.map
