const info = {
    pluginName: 'content-manager',
    type: 'admin'
};
const historyVersionRouter = {
    type: 'admin',
    routes: [
        {
            method: 'GET',
            info,
            path: '/history-versions',
            handler: 'history-version.findMany',
            config: {
                policies: [
                    'admin::isAuthenticatedAdmin'
                ]
            }
        },
        {
            method: 'PUT',
            info,
            path: '/history-versions/:versionId/restore',
            handler: 'history-version.restoreVersion',
            config: {
                policies: [
                    'admin::isAuthenticatedAdmin'
                ]
            }
        }
    ]
};

export { historyVersionRouter };
//# sourceMappingURL=history-version.mjs.map
