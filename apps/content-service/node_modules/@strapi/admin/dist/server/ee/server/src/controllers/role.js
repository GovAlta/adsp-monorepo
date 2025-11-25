'use strict';

var role$1 = require('../validation/role.js');
var index = require('../utils/index.js');

var role = {
    /**
   * Create a new role
   * @param {KoaContext} ctx - koa context
   */ async create (ctx) {
        await role$1.validateRoleCreateInput(ctx.request.body);
        const roleService = index.getService('role');
        const role = await roleService.create(ctx.request.body);
        const sanitizedRole = roleService.sanitizeRole(role);
        ctx.created({
            data: sanitizedRole
        });
    },
    /**
   * Delete a role
   * @param {KoaContext} ctx - koa context
   */ async deleteOne (ctx) {
        const { id } = ctx.params;
        await role$1.validateRoleDeleteInput(id);
        const roleService = index.getService('role');
        const roles = await roleService.deleteByIds([
            id
        ]);
        const sanitizedRole = roles.map((role)=>roleService.sanitizeRole(role))[0] || null;
        return ctx.deleted({
            data: sanitizedRole
        });
    },
    /**
   * delete several roles
   * @param {KoaContext} ctx - koa context
   */ async deleteMany (ctx) {
        const { body } = ctx.request;
        await role$1.validateRolesDeleteInput(body);
        const roleService = index.getService('role');
        const roles = await roleService.deleteByIds(body.ids);
        const sanitizedRoles = roles.map(roleService.sanitizeRole);
        return ctx.deleted({
            data: sanitizedRoles
        });
    }
};

module.exports = role;
//# sourceMappingURL=role.js.map
