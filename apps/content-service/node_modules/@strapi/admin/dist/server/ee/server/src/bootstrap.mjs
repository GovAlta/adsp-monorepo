import bootstrap$1 from '../../../server/src/bootstrap.mjs';
import { getService } from './utils/index.mjs';
import actions from './config/admin-actions.mjs';

var bootstrap = (async (args)=>{
    const { actionProvider } = getService('permission');
    const { persistTablesWithPrefix } = getService('persist-tables');
    if (strapi.ee.features.isEnabled('sso')) {
        await actionProvider.registerMany(actions.sso);
    }
    if (strapi.ee.features.isEnabled('audit-logs')) {
        await persistTablesWithPrefix('strapi_audit_logs');
        await actionProvider.registerMany(actions.auditLogs);
    }
    await getService('seat-enforcement').seatEnforcementWorkflow();
    await bootstrap$1(args);
});

export { bootstrap as default };
//# sourceMappingURL=bootstrap.mjs.map
