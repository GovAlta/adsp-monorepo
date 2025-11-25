'use strict';

var auditLogs = require('../validation/audit-logs.js');

var auditLogsController = {
    async findMany (ctx) {
        const { query } = ctx.request;
        await auditLogs.validateFindMany(query);
        const auditLogs$1 = strapi.get('audit-logs');
        const body = await auditLogs$1.findMany(query);
        ctx.body = body;
    },
    async findOne (ctx) {
        const { id } = ctx.params;
        const auditLogs = strapi.get('audit-logs');
        const body = await auditLogs.findOne(id);
        ctx.body = body;
        strapi.telemetry.send('didWatchAnAuditLog');
    }
};

module.exports = auditLogsController;
//# sourceMappingURL=audit-logs.js.map
