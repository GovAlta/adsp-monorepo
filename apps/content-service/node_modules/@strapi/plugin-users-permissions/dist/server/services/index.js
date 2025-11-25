'use strict';

var jwt = require('./jwt.js');
var providers = require('./providers.js');
var user = require('./user.js');
var role = require('./role.js');
var usersPermissions = require('./users-permissions.js');
var providersRegistry = require('./providers-registry.js');
var permission = require('./permission.js');

var services;
var hasRequiredServices;
function requireServices() {
    if (hasRequiredServices) return services;
    hasRequiredServices = 1;
    const jwt$1 = jwt.__require();
    const providers$1 = providers.__require();
    const user$1 = user.__require();
    const role$1 = role.__require();
    const usersPermissions$1 = usersPermissions.__require();
    const providersRegistry$1 = providersRegistry.__require();
    const permission$1 = permission.__require();
    services = {
        jwt: jwt$1,
        providers: providers$1,
        'providers-registry': providersRegistry$1,
        role: role$1,
        user: user$1,
        'users-permissions': usersPermissions$1,
        permission: permission$1
    };
    return services;
}

exports.__require = requireServices;
//# sourceMappingURL=index.js.map
