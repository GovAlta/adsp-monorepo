'use strict';

var utils = require('@strapi/utils');
var commonValidators = require('../common-validators.js');

const forgotPasswordSchema = utils.yup.object().shape({
    email: commonValidators.default.email.required()
}).required().noUnknown();
var validateForgotPasswordInput = utils.validateYupSchema(forgotPasswordSchema);

module.exports = validateForgotPasswordInput;
//# sourceMappingURL=forgot-password.js.map
