'use strict';

var index = require('../utils/index.js');
var componentCategory = require('./validation/component-category.js');

var componentCategories = {
    async editCategory (ctx) {
        const body = ctx.request.body;
        try {
            await componentCategory(body);
        } catch (error) {
            return ctx.send({
                error
            }, 400);
        }
        const { name } = ctx.params;
        strapi.reload.isWatching = false;
        const componentCategoryService = index.getService('component-categories');
        const newName = await componentCategoryService.editCategory(name, body);
        setImmediate(()=>strapi.reload());
        ctx.send({
            name: newName
        });
    },
    async deleteCategory (ctx) {
        const { name } = ctx.params;
        strapi.reload.isWatching = false;
        const componentCategoryService = index.getService('component-categories');
        await componentCategoryService.deleteCategory(name);
        setImmediate(()=>strapi.reload());
        ctx.send({
            name
        });
    }
};

module.exports = componentCategories;
//# sourceMappingURL=component-categories.js.map
