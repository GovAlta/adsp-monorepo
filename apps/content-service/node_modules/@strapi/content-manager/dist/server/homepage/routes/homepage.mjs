const info = {
    pluginName: 'content-manager',
    type: 'admin'
};
const homepageRouter = {
    type: 'admin',
    routes: [
        {
            method: 'GET',
            info,
            path: '/homepage/recent-documents',
            handler: 'homepage.getRecentDocuments',
            config: {
                policies: [
                    'admin::isAuthenticatedAdmin'
                ]
            }
        },
        {
            method: 'GET',
            info,
            path: '/homepage/count-documents',
            handler: 'homepage.getCountDocuments',
            config: {
                policies: [
                    'admin::isAuthenticatedAdmin'
                ]
            }
        }
    ]
};

export { homepageRouter };
//# sourceMappingURL=homepage.mjs.map
