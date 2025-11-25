'use strict';

var utils = require('@strapi/utils');
var commonValidators = require('../common-validators.js');

const registrationSchema = utils.yup.object().shape({
    registrationToken: utils.yup.string().required(),
    userInfo: utils.yup.object().shape({
        firstname: commonValidators.default.firstname.required(),
        lastname: commonValidators.default.lastname.nullable(),
        password: commonValidators.default.password.required()
    }).required().noUnknown(),
    deviceId: utils.yup.string().uuid().optional(),
    rememberMe: utils.yup.boolean().optional()
}).noUnknown();
const registrationInfoQuerySchema = utils.yup.object().shape({
    registrationToken: utils.yup.string().required()
}).required().noUnknown();
const adminRegistrationSchema = utils.yup.object().shape({
    email: commonValidators.default.email.required(),
    firstname: commonValidators.default.firstname.required(),
    lastname: commonValidators.default.lastname.nullable(),
    password: commonValidators.default.password.required(),
    deviceId: utils.yup.string().uuid().optional(),
    rememberMe: utils.yup.boolean().optional()
}).required().noUnknown();
const validateRegistrationInput = utils.validateYupSchema(registrationSchema);
const validateRegistrationInfoQuery = utils.validateYupSchema(registrationInfoQuerySchema);
const validateAdminRegistrationInput = utils.validateYupSchema(adminRegistrationSchema);

exports.validateAdminRegistrationInput = validateAdminRegistrationInput;
exports.validateRegistrationInfoQuery = validateRegistrationInfoQuery;
exports.validateRegistrationInput = validateRegistrationInput;
//# sourceMappingURL=register.js.map
