import { __require as requireJwt } from './jwt.mjs';
import { __require as requireProviders } from './providers.mjs';
import { __require as requireUser } from './user.mjs';
import { __require as requireRole } from './role.mjs';
import { __require as requireUsersPermissions } from './users-permissions.mjs';
import { __require as requireProvidersRegistry } from './providers-registry.mjs';
import { __require as requirePermission } from './permission.mjs';

var services;
var hasRequiredServices;
function requireServices() {
    if (hasRequiredServices) return services;
    hasRequiredServices = 1;
    const jwt = requireJwt();
    const providers = requireProviders();
    const user = requireUser();
    const role = requireRole();
    const usersPermissions = requireUsersPermissions();
    const providersRegistry = requireProvidersRegistry();
    const permission = requirePermission();
    services = {
        jwt,
        providers,
        'providers-registry': providersRegistry,
        role,
        user,
        'users-permissions': usersPermissions,
        permission
    };
    return services;
}

export { requireServices as __require };
//# sourceMappingURL=index.mjs.map
