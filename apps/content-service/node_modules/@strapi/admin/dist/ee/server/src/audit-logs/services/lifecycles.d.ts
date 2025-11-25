import type { Core } from '@strapi/types';
/**
 * @description
 * Manages the the lifecycle of audit logs. Accessible via strapi.get('audit-logs-lifecycles')
 */
declare const createAuditLogsLifecycleService: (strapi: Core.Strapi) => {
    register(): Promise<any>;
    unsubscribe(): any;
    destroy(): any;
};
export { createAuditLogsLifecycleService };
//# sourceMappingURL=lifecycles.d.ts.map