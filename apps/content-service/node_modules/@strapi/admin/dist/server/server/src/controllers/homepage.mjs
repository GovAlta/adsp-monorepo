import { getService } from '../utils/index.mjs';

var homepage = {
    async getKeyStatistics () {
        const homepageService = getService('homepage');
        return {
            data: await homepageService.getKeyStatistics()
        };
    },
    async getHomepageLayout (ctx) {
        const homepageService = getService('homepage');
        const userId = ctx.state.user?.id;
        const data = await homepageService.getHomepageLayout(userId);
        return {
            data
        };
    },
    async updateHomepageLayout (ctx) {
        const homepageService = getService('homepage');
        const userId = ctx.state.user?.id;
        const body = ctx.request.body;
        const data = await homepageService.updateHomepageLayout(userId, body);
        return {
            data
        };
    }
};

export { homepage as default };
//# sourceMappingURL=homepage.mjs.map
