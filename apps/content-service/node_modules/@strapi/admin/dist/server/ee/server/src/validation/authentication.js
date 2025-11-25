'use strict';

var utils = require('@strapi/utils');

const providerOptionsUpdateSchema = utils.yup.object().shape({
    autoRegister: utils.yup.boolean().required(),
    defaultRole: utils.yup.strapiID().when('autoRegister', (value, initSchema)=>{
        return value ? initSchema.required() : initSchema.nullable();
    }).test('is-valid-role', 'You must submit a valid default role', (roleId)=>{
        if (roleId === null) {
            return true;
        }
        return strapi.service('admin::role').exists({
            id: roleId
        });
    }),
    ssoLockedRoles: utils.yup.array().nullable().of(utils.yup.strapiID().test('is-valid-role', 'You must submit a valid role for the SSO Locked roles', (roleId)=>{
        return strapi.service('admin::role').exists({
            id: roleId
        });
    }))
});
const validateProviderOptionsUpdate = utils.validateYupSchema(providerOptionsUpdateSchema);

exports.validateProviderOptionsUpdate = validateProviderOptionsUpdate;
//# sourceMappingURL=authentication.js.map
