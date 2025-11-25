'use strict';

var utils = require('@strapi/utils');

const roleCreateSchema = utils.yup.object().shape({
    name: utils.yup.string().min(1).required(),
    description: utils.yup.string().nullable()
}).noUnknown();
const rolesDeleteSchema = utils.yup.object().shape({
    ids: utils.yup.array().of(utils.yup.strapiID()).min(1).required().test('roles-deletion-checks', 'Roles deletion checks have failed', async function rolesDeletionChecks(ids) {
        try {
            await strapi.service('admin::role').checkRolesIdForDeletion(ids);
            if (strapi.ee.features.isEnabled('sso')) {
                await strapi.service('admin::role').ssoCheckRolesIdForDeletion(ids);
            }
        } catch (e) {
            return this.createError({
                path: 'ids',
                message: e.message
            });
        }
        return true;
    })
}).noUnknown();
const roleDeleteSchema = utils.yup.strapiID().required().test('no-admin-single-delete', 'Role deletion checks have failed', async function noAdminSingleDelete(id) {
    try {
        await strapi.service('admin::role').checkRolesIdForDeletion([
            id
        ]);
        if (strapi.ee.features.isEnabled('sso')) {
            await strapi.service('admin::role').ssoCheckRolesIdForDeletion([
                id
            ]);
        }
    } catch (e) {
        return this.createError({
            path: 'id',
            message: e.message
        });
    }
    return true;
});
const validateRoleCreateInput = utils.validateYupSchema(roleCreateSchema);
const validateRolesDeleteInput = utils.validateYupSchema(rolesDeleteSchema);
const validateRoleDeleteInput = utils.validateYupSchema(roleDeleteSchema);

exports.validateRoleCreateInput = validateRoleCreateInput;
exports.validateRoleDeleteInput = validateRoleDeleteInput;
exports.validateRolesDeleteInput = validateRolesDeleteInput;
//# sourceMappingURL=role.js.map
