'use strict';

var index = require('./admin/index.js');
var index$1 = require('./content-api/index.js');

var routes;
var hasRequiredRoutes;
function requireRoutes() {
    if (hasRequiredRoutes) return routes;
    hasRequiredRoutes = 1;
    routes = {
        admin: index.__require(),
        'content-api': index$1.__require()
    };
    return routes;
}

exports.__require = requireRoutes;
//# sourceMappingURL=index.js.map
