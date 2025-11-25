'use strict';

var utils = require('@strapi/utils');
var role$1 = require('../validation/role.js');
var permission = require('../validation/permission.js');
var constants = require('../services/constants.js');
var index = require('../utils/index.js');

const { ApplicationError } = utils.errors;
const { SUPER_ADMIN_CODE } = constants;
var role = {
    /**
   * Create a new role
   * @param {KoaContext} ctx - koa context
   */ async create (ctx) {
        const { body } = ctx.request;
        await role$1.validateRoleCreateInput(body);
        const roleService = index.getService('role');
        const role = await roleService.create(body);
        const sanitizedRole = roleService.sanitizeRole(role);
        ctx.created({
            data: sanitizedRole
        });
    },
    /**
   * Returns on role by id
   * @param {KoaContext} ctx - koa context
   */ async findOne (ctx) {
        const { id } = ctx.params;
        const role = await index.getService('role').findOneWithUsersCount({
            id
        });
        if (!role) {
            return ctx.notFound('role.notFound');
        }
        ctx.body = {
            data: role
        };
    },
    /**
   * Returns every roles
   * @param {KoaContext} ctx - koa context
   */ async findAll (ctx) {
        const { query } = ctx.request;
        const permissionsManager = index.getService('permission').createPermissionsManager({
            ability: ctx.state.userAbility,
            model: 'admin::role'
        });
        await permissionsManager.validateQuery(query);
        const sanitizedQuery = await permissionsManager.sanitizeQuery(query);
        const roles = await index.getService('role').findAllWithUsersCount(sanitizedQuery);
        ctx.body = {
            data: roles
        };
    },
    /**
   * Updates a role by id
   * @param {KoaContext} ctx - koa context
   */ async update (ctx) {
        const { id } = ctx.params;
        const { body } = ctx.request;
        const roleService = index.getService('role');
        await role$1.validateRoleUpdateInput(body);
        const role = await roleService.findOne({
            id
        });
        if (!role) {
            return ctx.notFound('role.notFound');
        }
        if (role.code === SUPER_ADMIN_CODE) {
            throw new ApplicationError("Super admin can't be edited.");
        }
        const updatedRole = await roleService.update({
            id
        }, body);
        const sanitizedRole = roleService.sanitizeRole(updatedRole);
        ctx.body = {
            data: sanitizedRole
        };
    },
    /**
   * Returns the permissions assigned to a role
   * @param {KoaContext} ctx - koa context
   */ async getPermissions (ctx) {
        const { id } = ctx.params;
        const roleService = index.getService('role');
        const permissionService = index.getService('permission');
        const role = await roleService.findOne({
            id
        });
        if (!role) {
            return ctx.notFound('role.notFound');
        }
        const permissions = await permissionService.findMany({
            where: {
                role: {
                    id: role.id
                }
            }
        });
        const sanitizedPermissions = permissions.map(permissionService.sanitizePermission);
        ctx.body = {
            // @ts-expect-error - transform response type to sanitized permission
            data: sanitizedPermissions
        };
    },
    /**
   * Updates the permissions assigned to a role
   * @param {KoaContext} ctx - koa context
   */ async updatePermissions (ctx) {
        const { id } = ctx.params;
        const { body: input } = ctx.request;
        const roleService = index.getService('role');
        const permissionService = index.getService('permission');
        const role = await roleService.findOne({
            id
        });
        if (!role) {
            return ctx.notFound('role.notFound');
        }
        if (role.code === SUPER_ADMIN_CODE) {
            throw new ApplicationError("Super admin permissions can't be edited.");
        }
        await permission.validatedUpdatePermissionsInput(input);
        if (!role) {
            return ctx.notFound('role.notFound');
        }
        const permissions = await roleService.assignPermissions(role.id, input.permissions);
        const sanitizedPermissions = permissions.map(permissionService.sanitizePermission);
        ctx.body = {
            data: sanitizedPermissions
        };
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
