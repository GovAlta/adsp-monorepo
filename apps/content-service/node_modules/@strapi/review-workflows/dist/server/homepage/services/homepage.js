'use strict';

const createHomepageService = ({ strapi })=>{
    return {
        async getRecentlyAssignedDocuments () {
            const userId = strapi.requestContext.get()?.state?.user.id;
            const { queryLastDocuments, addStatusToDocuments } = strapi.plugin('content-manager').service('homepage');
            const recentlyAssignedDocuments = await queryLastDocuments({
                populate: [
                    'strapi_stage'
                ],
                filters: {
                    strapi_assignee: {
                        id: userId
                    }
                }
            });
            return addStatusToDocuments(recentlyAssignedDocuments);
        }
    };
};

exports.createHomepageService = createHomepageService;
//# sourceMappingURL=homepage.js.map
