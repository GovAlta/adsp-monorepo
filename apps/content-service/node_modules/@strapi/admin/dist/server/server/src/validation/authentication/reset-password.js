'use strict';

var utils = require('@strapi/utils');
var commonValidators = require('../common-validators.js');

const resetPasswordSchema = utils.yup.object().shape({
    resetPasswordToken: utils.yup.string().required(),
    password: commonValidators.default.password.required()
}).required().noUnknown();
var validateResetPasswordInput = utils.validateYupSchema(resetPasswordSchema);

module.exports = validateResetPasswordInput;
//# sourceMappingURL=reset-password.js.map
