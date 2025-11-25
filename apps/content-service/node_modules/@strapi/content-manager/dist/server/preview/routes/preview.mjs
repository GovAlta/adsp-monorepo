const info = {
    pluginName: 'content-manager',
    type: 'admin'
};
const previewRouter = {
    type: 'admin',
    routes: [
        {
            method: 'GET',
            info,
            path: '/preview/url/:contentType',
            handler: 'preview.getPreviewUrl',
            config: {
                policies: [
                    'admin::isAuthenticatedAdmin'
                ]
            }
        }
    ]
};

export { previewRouter };
//# sourceMappingURL=preview.mjs.map
