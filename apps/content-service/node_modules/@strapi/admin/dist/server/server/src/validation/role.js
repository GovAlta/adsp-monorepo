'use strict';

var utils = require('@strapi/utils');

const roleCreateSchema = utils.yup.object().shape({
    name: utils.yup.string().min(1).required(),
    description: utils.yup.string().nullable()
}).noUnknown();
const rolesDeleteSchema = utils.yup.object().shape({
    ids: utils.yup.array().of(utils.yup.strapiID()).min(1).required().test('roles-deletion-checks', 'Roles deletion checks have failed', async function(ids) {
        try {
            await strapi.service('admin::role').checkRolesIdForDeletion(ids);
        } catch (e) {
            // @ts-expect-error yup types
            return this.createError({
                path: 'ids',
                message: e.message
            });
        }
        return true;
    })
}).noUnknown();
const roleDeleteSchema = utils.yup.strapiID().required().test('no-admin-single-delete', 'Role deletion checks have failed', async function(id) {
    try {
        await strapi.service('admin::role').checkRolesIdForDeletion([
            id
        ]);
    } catch (e) {
        // @ts-expect-error yup types
        return this.createError({
            path: 'id',
            message: e.message
        });
    }
    return true;
});
const roleUpdateSchema = utils.yup.object().shape({
    name: utils.yup.string().min(1),
    description: utils.yup.string().nullable()
}).noUnknown();
const validateRoleCreateInput = utils.validateYupSchema(roleCreateSchema);
const validateRoleUpdateInput = utils.validateYupSchema(roleUpdateSchema);
const validateRolesDeleteInput = utils.validateYupSchema(rolesDeleteSchema);
const validateRoleDeleteInput = utils.validateYupSchema(roleDeleteSchema);

exports.validateRoleCreateInput = validateRoleCreateInput;
exports.validateRoleDeleteInput = validateRoleDeleteInput;
exports.validateRoleUpdateInput = validateRoleUpdateInput;
exports.validateRolesDeleteInput = validateRolesDeleteInput;
//# sourceMappingURL=role.js.map
