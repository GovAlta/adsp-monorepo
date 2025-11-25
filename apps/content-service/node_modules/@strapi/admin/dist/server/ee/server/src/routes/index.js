'use strict';

var sso = require('./sso.js');
var licenseLimit = require('./license-limit.js');

var routes = {
    sso,
    'license-limit': licenseLimit
};

module.exports = routes;
//# sourceMappingURL=index.js.map
