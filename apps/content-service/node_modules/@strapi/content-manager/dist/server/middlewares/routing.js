'use strict';

var isNil = require('lodash/isNil');

var routing = (async (ctx, next)=>{
    const { model } = ctx.params;
    const ct = strapi.contentTypes[model];
    if (!ct) {
        return ctx.send({
            error: 'contentType.notFound'
        }, 404);
    }
    let controllers;
    if (!ct.plugin || ct.plugin === 'admin') {
        controllers = strapi.admin.controllers;
    } else {
        controllers = strapi.plugin(ct.plugin).controllers;
    }
    const { route } = ctx.state;
    if (typeof route.handler !== 'string') {
        return next();
    }
    const [, action] = route.handler.split('.');
    let actionConfig;
    if (!ct.plugin || ct.plugin === 'admin') {
        actionConfig = strapi.config.get(`admin.layout.${ct.modelName}.actions.${action}`);
    } else {
        actionConfig = strapi.plugin(ct.plugin).config(`layout.${ct.modelName}.actions.${action}`);
    }
    if (!isNil(actionConfig)) {
        const [controller, action] = actionConfig.split('.');
        if (controller && action) {
            return controllers[controller.toLowerCase()][action](ctx, next);
        }
    }
    await next();
});

module.exports = routing;
//# sourceMappingURL=routing.js.map
