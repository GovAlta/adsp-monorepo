'use strict';

/**
 * All these routes are relative to the `/admin/settings/*` route
 * as such their path should not start with a `/` or include the `/settings` prefix.
 */ const getEERoutes = ()=>[
        ...window.strapi.features.isEnabled(window.strapi.features.AUDIT_LOGS) ? [
            {
                path: 'audit-logs',
                lazy: async ()=>{
                    const { ProtectedListPage } = await Promise.resolve().then(function () { return require('./pages/AuditLogs/ListPage.js'); });
                    return {
                        Component: ProtectedListPage
                    };
                }
            }
        ] : [],
        ...window.strapi.features.isEnabled(window.strapi.features.SSO) ? [
            {
                path: 'single-sign-on',
                lazy: async ()=>{
                    const { ProtectedSSO } = await Promise.resolve().then(function () { return require('./pages/SingleSignOnPage.js'); });
                    return {
                        Component: ProtectedSSO
                    };
                }
            }
        ] : []
    ];

exports.getEERoutes = getEERoutes;
//# sourceMappingURL=constants.js.map
