'use strict';

var licenseLimit = {
    type: 'admin',
    routes: [
        // License limit infos
        {
            method: 'GET',
            path: '/license-limit-information',
            handler: 'admin.licenseLimitInformation',
            config: {
                policies: [
                    'admin::isAuthenticatedAdmin'
                ]
            }
        }
    ]
};

module.exports = licenseLimit;
//# sourceMappingURL=license-limit.js.map
