import require$$1 from '@strapi/utils';
import { __require as requireAuth } from './auth.mjs';
import { __require as requireUser } from './user.mjs';
import { __require as requireRole } from './role.mjs';
import { __require as requirePermissions } from './permissions.mjs';

var contentApi;
var hasRequiredContentApi;
function requireContentApi() {
    if (hasRequiredContentApi) return contentApi;
    hasRequiredContentApi = 1;
    const { createContentApiRoutesFactory } = require$$1;
    const authRoutes = requireAuth();
    const userRoutes = requireUser();
    const roleRoutes = requireRole();
    const permissionsRoutes = requirePermissions();
    const createContentApiRoutes = createContentApiRoutesFactory(()=>{
        return [
            ...authRoutes(strapi),
            ...userRoutes(strapi),
            ...roleRoutes(strapi),
            ...permissionsRoutes(strapi)
        ];
    });
    contentApi = createContentApiRoutes;
    return contentApi;
}

export { requireContentApi as __require };
//# sourceMappingURL=index.mjs.map
