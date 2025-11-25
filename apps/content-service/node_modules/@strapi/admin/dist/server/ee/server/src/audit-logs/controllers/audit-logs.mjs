import { validateFindMany } from '../validation/audit-logs.mjs';

var auditLogsController = {
    async findMany (ctx) {
        const { query } = ctx.request;
        await validateFindMany(query);
        const auditLogs = strapi.get('audit-logs');
        const body = await auditLogs.findMany(query);
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

export { auditLogsController as default };
//# sourceMappingURL=audit-logs.mjs.map
