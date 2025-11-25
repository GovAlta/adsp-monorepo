'use strict';

var utils = require('@strapi/utils');
var index = require('../utils/index.js');
var commonValidators = require('./common-validators.js');

const checkPermissionsSchema = utils.yup.object().shape({
    permissions: utils.yup.array().of(utils.yup.object().shape({
        action: utils.yup.string().required(),
        subject: utils.yup.string().nullable(),
        field: utils.yup.string()
    }).noUnknown())
});
const checkPermissionsExist = function(permissions) {
    const existingActions = index.getService('permission').actionProvider.values();
    const failIndex = permissions.findIndex((permission)=>!existingActions.some((action)=>action.actionId === permission.action && (action.section !== 'contentTypes' || action.subjects.includes(permission.subject))));
    return failIndex === -1 ? true : this.createError({
        path: 'permissions',
        message: `[${failIndex}] is not an existing permission action`
    });
};
const actionsExistSchema = utils.yup.array().of(utils.yup.object().shape({
    conditions: utils.yup.array().of(utils.yup.string())
})).test('actions-exist', '', checkPermissionsExist);
const validatePermissionsExist = utils.validateYupSchema(actionsExistSchema);
const validateCheckPermissionsInput = utils.validateYupSchema(checkPermissionsSchema);
const validatedUpdatePermissionsInput = utils.validateYupSchema(commonValidators.default.updatePermissions);

exports.validateCheckPermissionsInput = validateCheckPermissionsInput;
exports.validatePermissionsExist = validatePermissionsExist;
exports.validatedUpdatePermissionsInput = validatedUpdatePermissionsInput;
//# sourceMappingURL=permission.js.map
