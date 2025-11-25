'use strict';

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

exports.previewRouter = previewRouter;
//# sourceMappingURL=preview.js.map
