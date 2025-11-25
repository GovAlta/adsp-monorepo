import { __require as requireAdmin } from './admin/index.mjs';
import { __require as requireContentApi } from './content-api/index.mjs';

var routes;
var hasRequiredRoutes;
function requireRoutes() {
    if (hasRequiredRoutes) return routes;
    hasRequiredRoutes = 1;
    routes = {
        admin: requireAdmin(),
        'content-api': requireContentApi()
    };
    return routes;
}

export { requireRoutes as __require };
//# sourceMappingURL=index.mjs.map
