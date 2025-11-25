'use strict';

var actions = {
    sso: [
        {
            uid: 'provider-login.read',
            displayName: 'Read',
            pluginName: 'admin',
            section: 'settings',
            category: 'single sign on',
            subCategory: 'options'
        },
        {
            uid: 'provider-login.update',
            displayName: 'Update',
            pluginName: 'admin',
            section: 'settings',
            category: 'single sign on',
            subCategory: 'options'
        }
    ],
    auditLogs: [
        {
            uid: 'audit-logs.read',
            displayName: 'Read',
            pluginName: 'admin',
            section: 'settings',
            category: 'audit logs',
            subCategory: 'options'
        }
    ]
};

module.exports = actions;
//# sourceMappingURL=admin-actions.js.map
