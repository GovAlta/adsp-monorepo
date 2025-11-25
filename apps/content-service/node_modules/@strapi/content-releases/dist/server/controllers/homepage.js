'use strict';

const homepageController = ()=>{
    const homepageService = strapi.plugin('content-releases').service('homepage');
    return {
        async getUpcomingReleases () {
            return {
                data: await homepageService.getUpcomingReleases()
            };
        }
    };
};

module.exports = homepageController;
//# sourceMappingURL=homepage.js.map
