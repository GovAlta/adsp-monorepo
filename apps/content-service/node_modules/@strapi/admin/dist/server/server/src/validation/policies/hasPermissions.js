'use strict';

var _ = require('lodash');
var utils = require('@strapi/utils');

const hasPermissionsSchema = utils.yup.object({
    actions: utils.yup.array().of(// @ts-expect-error yup types
    utils.yup.lazy((val)=>{
        if (_.isArray(val)) {
            return utils.yup.array().of(utils.yup.string()).min(1).max(2);
        }
        if (_.isString(val)) {
            return utils.yup.string().required();
        }
        return utils.yup.object().shape({
            action: utils.yup.string().required(),
            subject: utils.yup.string()
        });
    }))
});
const validateHasPermissionsInput = utils.validateYupSchema(hasPermissionsSchema);

exports.validateHasPermissionsInput = validateHasPermissionsInput;
//# sourceMappingURL=hasPermissions.js.map
