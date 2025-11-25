'use strict';

var utils = require('./utils.js');

var sso = {
    type: 'admin',
    routes: [
        {
            method: 'GET',
            path: '/providers',
            handler: 'authentication.getProviders',
            config: {
                middlewares: [
                    utils.enableFeatureMiddleware('sso')
                ],
                auth: false
            }
        },
        {
            method: 'GET',
            path: '/connect/:provider',
            handler: 'authentication.providerLogin',
            config: {
                middlewares: [
                    utils.enableFeatureMiddleware('sso')
                ],
                auth: false
            }
        },
        {
            method: 'POST',
            path: '/connect/:provider',
            handler: 'authentication.providerLogin',
            config: {
                middlewares: [
                    utils.enableFeatureMiddleware('sso')
                ],
                auth: false
            }
        },
        {
            method: 'GET',
            path: '/providers/options',
            handler: 'authentication.getProviderLoginOptions',
            config: {
                middlewares: [
                    utils.enableFeatureMiddleware('sso')
                ],
                policies: [
                    'admin::isAuthenticatedAdmin',
                    {
                        name: 'admin::hasPermissions',
                        config: {
                            actions: [
                                'admin::provider-login.read'
                            ]
                        }
                    }
                ]
            }
        },
        {
            method: 'PUT',
            path: '/providers/options',
            handler: 'authentication.updateProviderLoginOptions',
            config: {
                middlewares: [
                    utils.enableFeatureMiddleware('sso')
                ],
                policies: [
                    'admin::isAuthenticatedAdmin',
                    {
                        name: 'admin::hasPermissions',
                        config: {
                            actions: [
                                'admin::provider-login.update'
                            ]
                        }
                    }
                ]
            }
        },
        {
            method: 'GET',
            path: '/providers/isSSOLocked',
            handler: 'user.isSSOLocked',
            config: {
                middlewares: [
                    utils.enableFeatureMiddleware('sso')
                ],
                policies: [
                    'admin::isAuthenticatedAdmin'
                ]
            }
        }
    ]
};

module.exports = sso;
//# sourceMappingURL=sso.js.map
