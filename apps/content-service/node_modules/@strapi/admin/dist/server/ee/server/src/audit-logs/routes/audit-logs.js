'use strict';

var utils = require('../../routes/utils.js');

var auditLogsRoutes = {
    type: 'admin',
    routes: [
        {
            method: 'GET',
            path: '/audit-logs',
            handler: 'audit-logs.findMany',
            config: {
                middlewares: [
                    utils.enableFeatureMiddleware('audit-logs')
                ],
                policies: [
                    'admin::isAuthenticatedAdmin',
                    {
                        name: 'admin::hasPermissions',
                        config: {
                            actions: [
                                'admin::audit-logs.read'
                            ]
                        }
                    }
                ]
            }
        },
        {
            method: 'GET',
            path: '/audit-logs/:id',
            handler: 'audit-logs.findOne',
            config: {
                middlewares: [
                    utils.enableFeatureMiddleware('audit-logs')
                ],
                policies: [
                    'admin::isAuthenticatedAdmin',
                    {
                        name: 'admin::hasPermissions',
                        config: {
                            actions: [
                                'admin::audit-logs.read'
                            ]
                        }
                    }
                ]
            }
        }
    ]
};

module.exports = auditLogsRoutes;
//# sourceMappingURL=audit-logs.js.map
