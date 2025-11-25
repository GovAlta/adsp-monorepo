'use strict';

const createHomepageController = ()=>{
    const homepageService = strapi.plugin('review-workflows').service('homepage');
    return {
        async getRecentlyAssignedDocuments () {
            return {
                data: await homepageService.getRecentlyAssignedDocuments()
            };
        }
    };
};

exports.createHomepageController = createHomepageController;
//# sourceMappingURL=homepage.js.map
