'use strict';

var index = require('../utils/index.js');

var homepage = {
    async getKeyStatistics () {
        const homepageService = index.getService('homepage');
        return {
            data: await homepageService.getKeyStatistics()
        };
    },
    async getHomepageLayout (ctx) {
        const homepageService = index.getService('homepage');
        const userId = ctx.state.user?.id;
        const data = await homepageService.getHomepageLayout(userId);
        return {
            data
        };
    },
    async updateHomepageLayout (ctx) {
        const homepageService = index.getService('homepage');
        const userId = ctx.state.user?.id;
        const body = ctx.request.body;
        const data = await homepageService.updateHomepageLayout(userId, body);
        return {
            data
        };
    }
};

module.exports = homepage;
//# sourceMappingURL=homepage.js.map
