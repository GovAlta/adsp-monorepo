'use strict';

var homepage = [
    {
        method: 'GET',
        path: '/homepage/key-statistics',
        handler: 'homepage.getKeyStatistics',
        config: {
            policies: [
                'admin::isAuthenticatedAdmin'
            ]
        }
    },
    {
        method: 'GET',
        path: '/homepage/layout',
        handler: 'homepage.getHomepageLayout',
        config: {
            policies: [
                'admin::isAuthenticatedAdmin'
            ]
        }
    },
    {
        method: 'PUT',
        path: '/homepage/layout',
        handler: 'homepage.updateHomepageLayout',
        config: {
            policies: [
                'admin::isAuthenticatedAdmin'
            ]
        }
    }
];

module.exports = homepage;
//# sourceMappingURL=homepage.js.map
