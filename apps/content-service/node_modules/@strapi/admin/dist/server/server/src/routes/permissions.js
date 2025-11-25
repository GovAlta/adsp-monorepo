'use strict';

var permissions = [
    {
        method: 'GET',
        path: '/permissions',
        handler: 'permission.getAll',
        config: {
            policies: [
                'admin::isAuthenticatedAdmin'
            ]
        }
    },
    {
        method: 'POST',
        path: '/permissions/check',
        handler: 'permission.check',
        config: {
            policies: [
                'admin::isAuthenticatedAdmin'
            ]
        }
    }
];

module.exports = permissions;
//# sourceMappingURL=permissions.js.map
