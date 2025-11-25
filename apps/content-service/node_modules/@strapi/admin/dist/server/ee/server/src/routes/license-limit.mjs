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

export { licenseLimit as default };
//# sourceMappingURL=license-limit.mjs.map
