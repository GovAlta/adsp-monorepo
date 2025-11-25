'use strict';

var permission$1 = require('../validation/permission.js');
var index = require('../utils/index.js');
var conditions = require('./formatters/conditions.js');

var permission = {
    /**
   * Check each permissions from `request.body.permissions` and returns an array of booleans
   * @param {KoaContext} ctx - koa context
   */ async check (ctx) {
        const { body: input } = ctx.request;
        const { userAbility } = ctx.state;
        await permission$1.validateCheckPermissionsInput(input);
        const { engine } = index.getService('permission');
        const checkPermissionsFn = engine.checkMany(userAbility);
        ctx.body = {
            data: checkPermissionsFn(input.permissions)
        };
    },
    /**
   * Returns every permissions, in nested format
   * @param {KoaContext} ctx - koa context
   */ async getAll (ctx) {
        const { sectionsBuilder, actionProvider, conditionProvider } = index.getService('permission');
        const actions = actionProvider.values();
        const conditions$1 = conditionProvider.values();
        const sections = await sectionsBuilder.build(actions);
        ctx.body = {
            data: {
                // @ts-expect-error - refactor to use a proper type
                conditions: conditions.formatConditions(conditions$1),
                sections
            }
        };
    }
};

module.exports = permission;
//# sourceMappingURL=permission.js.map
