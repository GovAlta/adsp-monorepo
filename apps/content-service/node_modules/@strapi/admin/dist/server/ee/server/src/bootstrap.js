'use strict';

var bootstrap$1 = require('../../../server/src/bootstrap.js');
var index = require('./utils/index.js');
var adminActions = require('./config/admin-actions.js');

var bootstrap = (async (args)=>{
    const { actionProvider } = index.getService('permission');
    const { persistTablesWithPrefix } = index.getService('persist-tables');
    if (strapi.ee.features.isEnabled('sso')) {
        await actionProvider.registerMany(adminActions.sso);
    }
    if (strapi.ee.features.isEnabled('audit-logs')) {
        await persistTablesWithPrefix('strapi_audit_logs');
        await actionProvider.registerMany(adminActions.auditLogs);
    }
    await index.getService('seat-enforcement').seatEnforcementWorkflow();
    await bootstrap$1(args);
});

module.exports = bootstrap;
//# sourceMappingURL=bootstrap.js.map
