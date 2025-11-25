'use strict';

var strapiUtils = require('@strapi/utils');

const hasPermissionsSchema = strapiUtils.yup.object({
    actions: strapiUtils.yup.array().of(strapiUtils.yup.string()),
    hasAtLeastOne: strapiUtils.yup.boolean()
});
const validateHasPermissionsInput = strapiUtils.validateYupSchemaSync(hasPermissionsSchema);

exports.validateHasPermissionsInput = validateHasPermissionsInput;
//# sourceMappingURL=hasPermissions.js.map
