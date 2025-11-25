import { __require as requirePermissions } from './permissions.mjs';
import { __require as requireSettings } from './settings.mjs';
import { __require as requireRole } from './role.mjs';

var admin;
var hasRequiredAdmin;
function requireAdmin() {
    if (hasRequiredAdmin) return admin;
    hasRequiredAdmin = 1;
    const permissionsRoutes = requirePermissions();
    const settingsRoutes = requireSettings();
    const roleRoutes = requireRole();
    admin = {
        type: 'admin',
        routes: [
            ...roleRoutes,
            ...settingsRoutes,
            ...permissionsRoutes
        ]
    };
    return admin;
}

export { requireAdmin as __require };
//# sourceMappingURL=index.mjs.map
