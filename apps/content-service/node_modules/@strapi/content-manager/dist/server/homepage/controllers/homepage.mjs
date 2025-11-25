import * as yup from 'yup';
import { errors } from '@strapi/utils';

const createHomepageController = ()=>{
    const homepageService = strapi.plugin('content-manager').service('homepage');
    const recentDocumentParamsSchema = yup.object().shape({
        action: yup.mixed().oneOf([
            'update',
            'publish'
        ]).required()
    });
    return {
        async getRecentDocuments (ctx) {
            let action;
            try {
                action = (await recentDocumentParamsSchema.validate(ctx.query)).action;
            } catch (error) {
                if (error instanceof yup.ValidationError) {
                    throw new errors.ValidationError(error.message);
                }
                throw error;
            }
            if (action === 'publish') {
                return {
                    data: await homepageService.getRecentlyPublishedDocuments()
                };
            }
            return {
                data: await homepageService.getRecentlyUpdatedDocuments()
            };
        },
        async getCountDocuments () {
            return {
                data: await homepageService.getCountDocuments()
            };
        }
    };
};

export { createHomepageController };
//# sourceMappingURL=homepage.mjs.map
