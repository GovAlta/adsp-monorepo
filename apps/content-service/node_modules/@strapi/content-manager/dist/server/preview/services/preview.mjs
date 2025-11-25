import { errors } from '@strapi/utils';
import { getService } from '../utils.mjs';

/**
 * Responsible of routing an entry to a preview URL.
 */ const createPreviewService = ({ strapi })=>{
    const config = getService(strapi, 'preview-config');
    return {
        async getPreviewUrl (uid, params) {
            const isConfigured = config.isConfigured();
            if (!isConfigured) {
                throw new errors.NotFoundError('Preview config not found');
            }
            const handler = config.getPreviewHandler();
            try {
                // Try to get the preview URL from the user-defined handler
                return handler(uid, params);
            } catch (error) {
                // Log the error and throw a generic error
                strapi.log.error(`Failed to get preview URL: ${error}`);
                throw new errors.ApplicationError('Failed to get preview URL');
            }
        }
    };
};

export { createPreviewService };
//# sourceMappingURL=preview.mjs.map
