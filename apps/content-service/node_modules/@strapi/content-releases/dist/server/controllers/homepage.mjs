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

export { homepageController as default };
//# sourceMappingURL=homepage.mjs.map
