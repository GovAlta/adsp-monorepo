import { validateCheckPermissionsInput } from '../validation/permission.mjs';
import { getService } from '../utils/index.mjs';
import { formatConditions } from './formatters/conditions.mjs';

var permission = {
    /**
   * Check each permissions from `request.body.permissions` and returns an array of booleans
   * @param {KoaContext} ctx - koa context
   */ async check (ctx) {
        const { body: input } = ctx.request;
        const { userAbility } = ctx.state;
        await validateCheckPermissionsInput(input);
        const { engine } = getService('permission');
        const checkPermissionsFn = engine.checkMany(userAbility);
        ctx.body = {
            data: checkPermissionsFn(input.permissions)
        };
    },
    /**
   * Returns every permissions, in nested format
   * @param {KoaContext} ctx - koa context
   */ async getAll (ctx) {
        const { sectionsBuilder, actionProvider, conditionProvider } = getService('permission');
        const actions = actionProvider.values();
        const conditions = conditionProvider.values();
        const sections = await sectionsBuilder.build(actions);
        ctx.body = {
            data: {
                // @ts-expect-error - refactor to use a proper type
                conditions: formatConditions(conditions),
                sections
            }
        };
    }
};

export { permission as default };
//# sourceMappingURL=permission.mjs.map
