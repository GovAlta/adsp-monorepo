'use strict';

var utils = require('../utils.js');
var preview = require('./validation/preview.js');

const createPreviewController = ()=>{
    return {
        /**
     * Transforms an entry into a preview URL, so that it can be previewed
     * in the Content Manager.
     */ async getPreviewUrl (ctx) {
            const uid = ctx.params.contentType;
            const query = ctx.request.query;
            // Validate the request parameters
            const params = await preview.validatePreviewUrl(strapi, uid, query);
            // TODO: Permissions to preview content
            // Get the preview URL by using the user-defined config handler
            const previewService = utils.getService(strapi, 'preview');
            const url = await previewService.getPreviewUrl(uid, params);
            // If no url is found, set status to 204
            if (!url) {
                ctx.status = 204;
            }
            return {
                data: {
                    url
                }
            };
        }
    };
};

exports.createPreviewController = createPreviewController;
//# sourceMappingURL=preview.js.map
