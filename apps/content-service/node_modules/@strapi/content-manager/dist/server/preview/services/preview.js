'use strict';

var strapiUtils = require('@strapi/utils');
var utils = require('../utils.js');

/**
 * Responsible of routing an entry to a preview URL.
 */ const createPreviewService = ({ strapi })=>{
    const config = utils.getService(strapi, 'preview-config');
    return {
        async getPreviewUrl (uid, params) {
            const isConfigured = config.isConfigured();
            if (!isConfigured) {
                throw new strapiUtils.errors.NotFoundError('Preview config not found');
            }
            const handler = config.getPreviewHandler();
            try {
                // Try to get the preview URL from the user-defined handler
                return handler(uid, params);
            } catch (error) {
                // Log the error and throw a generic error
                strapi.log.error(`Failed to get preview URL: ${error}`);
                throw new strapiUtils.errors.ApplicationError('Failed to get preview URL');
            }
        }
    };
};

exports.createPreviewService = createPreviewService;
//# sourceMappingURL=preview.js.map
