'use strict';

var isAuthenticatedAdmin = require('./isAuthenticatedAdmin.js');
var hasPermissions = require('./hasPermissions.js');
var isTelemetryEnabled = require('./isTelemetryEnabled.js');

var policies = {
    isAuthenticatedAdmin,
    hasPermissions,
    isTelemetryEnabled
};

module.exports = policies;
//# sourceMappingURL=index.js.map
