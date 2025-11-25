import { __require as requireAuth } from './auth.mjs';
import { __require as requireUser } from './user.mjs';
import { __require as requireRole } from './role.mjs';
import { __require as requirePermissions } from './permissions.mjs';
import { __require as requireSettings } from './settings.mjs';
import { __require as requireContentManagerUser } from './content-manager-user.mjs';

var controllers;
var hasRequiredControllers;
function requireControllers() {
    if (hasRequiredControllers) return controllers;
    hasRequiredControllers = 1;
    const auth = requireAuth();
    const user = requireUser();
    const role = requireRole();
    const permissions = requirePermissions();
    const settings = requireSettings();
    const contentmanageruser = requireContentManagerUser();
    controllers = {
        auth,
        user,
        role,
        permissions,
        settings,
        contentmanageruser
    };
    return controllers;
}

export { requireControllers as __require };
//# sourceMappingURL=index.mjs.map
