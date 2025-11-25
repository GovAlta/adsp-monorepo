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
            path: '/homepage/recently-assigned-documents',
            handler: 'homepage.getRecentlyAssignedDocuments',
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
