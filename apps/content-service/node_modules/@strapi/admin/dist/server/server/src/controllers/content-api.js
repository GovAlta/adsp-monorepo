'use strict';

require('@strapi/types');

var contentApi = {
    async getPermissions (ctx) {
        const actionsMap = await strapi.contentAPI.permissions.getActionsMap();
        ctx.send({
            data: actionsMap
        });
    },
    async getRoutes (ctx) {
        const routesMap = await strapi.contentAPI.getRoutesMap();
        ctx.send({
            data: routesMap
        });
    }
};

module.exports = contentApi;
//# sourceMappingURL=content-api.js.map
