'use strict';

var permissions = require('./permissions.js');
var settings = require('./settings.js');
var role = require('./role.js');

var admin;
var hasRequiredAdmin;
function requireAdmin() {
    if (hasRequiredAdmin) return admin;
    hasRequiredAdmin = 1;
    const permissionsRoutes = permissions.__require();
    const settingsRoutes = settings.__require();
    const roleRoutes = role.__require();
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

exports.__require = requireAdmin;
//# sourceMappingURL=index.js.map
