'use strict';

var auth = require('./auth.js');
var user = require('./user.js');
var role = require('./role.js');
var permissions = require('./permissions.js');
var settings = require('./settings.js');
var contentManagerUser = require('./content-manager-user.js');

var controllers;
var hasRequiredControllers;
function requireControllers() {
    if (hasRequiredControllers) return controllers;
    hasRequiredControllers = 1;
    const auth$1 = auth.__require();
    const user$1 = user.__require();
    const role$1 = role.__require();
    const permissions$1 = permissions.__require();
    const settings$1 = settings.__require();
    const contentmanageruser = contentManagerUser.__require();
    controllers = {
        auth: auth$1,
        user: user$1,
        role: role$1,
        permissions: permissions$1,
        settings: settings$1,
        contentmanageruser
    };
    return controllers;
}

exports.__require = requireControllers;
//# sourceMappingURL=index.js.map
