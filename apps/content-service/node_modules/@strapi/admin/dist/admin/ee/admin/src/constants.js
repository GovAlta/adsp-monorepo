'use strict';

const ADMIN_PERMISSIONS_EE = {
    settings: {
        auditLogs: {
            main: [
                {
                    action: 'admin::audit-logs.read',
                    subject: null
                }
            ],
            read: [
                {
                    action: 'admin::audit-logs.read',
                    subject: null
                }
            ],
            update: [
                {
                    action: 'admin::audit-logs.update',
                    subject: null
                }
            ]
        },
        'review-workflows': {
            main: [
                {
                    action: 'admin::review-workflows.read',
                    subject: null
                }
            ],
            read: [
                {
                    action: 'admin::review-workflows.read',
                    subject: null
                }
            ],
            create: [
                {
                    action: 'admin::review-workflows.create',
                    subject: null
                }
            ],
            delete: [
                {
                    action: 'admin::review-workflows.delete',
                    subject: null
                }
            ],
            update: [
                {
                    action: 'admin::review-workflows.update',
                    subject: null
                }
            ]
        },
        sso: {
            main: [
                {
                    action: 'admin::provider-login.read',
                    subject: null
                }
            ],
            read: [
                {
                    action: 'admin::provider-login.read',
                    subject: null
                }
            ],
            update: [
                {
                    action: 'admin::provider-login.update',
                    subject: null
                }
            ]
        },
        releases: {
            read: [
                {
                    action: 'plugin::content-releases.settings.read',
                    subject: null
                }
            ],
            update: [
                {
                    action: 'plugin::content-releases.settings.update',
                    subject: null
                }
            ]
        }
    }
};
/**
 * Base EE routes, these are relative to the `root` of the app.
 * We use a function to get them so we're not looking at window
 * during build time.
 */ const getEERoutes = ()=>window.strapi.isEE ? [
        {
            path: 'auth/login/:authResponse',
            lazy: async ()=>{
                const { AuthResponse } = await Promise.resolve().then(function () { return require('./pages/AuthResponse.js'); });
                return {
                    Component: AuthResponse
                };
            }
        }
    ] : [];
const AUDIT_LOGS_DEFAULT_PAGE_SIZE = 50;
// TODO: the constants.js file is imported before the React application is setup and
// therefore `window.strapi` might not exist at import-time. We should probably define
// which constant is available at which stage of the application lifecycle.
const SETTINGS_LINKS_EE = ()=>({
        global: [
            ...window.strapi.features.isEnabled(window.strapi.features.SSO) ? [
                {
                    intlLabel: {
                        id: 'Settings.sso.title',
                        defaultMessage: 'Single Sign-On'
                    },
                    to: '/settings/single-sign-on',
                    id: 'sso',
                    licenseOnly: true
                }
            ] : []
        ],
        admin: [
            ...window.strapi.features.isEnabled(window.strapi.features.AUDIT_LOGS) ? [
                {
                    intlLabel: {
                        id: 'global.auditLogs',
                        defaultMessage: 'Audit Logs'
                    },
                    to: `/settings/audit-logs?pageSize=${AUDIT_LOGS_DEFAULT_PAGE_SIZE}&page=1&sort=date:DESC`,
                    id: 'auditLogs',
                    licenseOnly: true
                }
            ] : []
        ]
    });

exports.ADMIN_PERMISSIONS_EE = ADMIN_PERMISSIONS_EE;
exports.AUDIT_LOGS_DEFAULT_PAGE_SIZE = AUDIT_LOGS_DEFAULT_PAGE_SIZE;
exports.SETTINGS_LINKS_EE = SETTINGS_LINKS_EE;
exports.getEERoutes = getEERoutes;
//# sourceMappingURL=constants.js.map
