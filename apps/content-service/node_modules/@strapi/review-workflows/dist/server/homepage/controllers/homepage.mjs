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

export { createHomepageController };
//# sourceMappingURL=homepage.mjs.map
