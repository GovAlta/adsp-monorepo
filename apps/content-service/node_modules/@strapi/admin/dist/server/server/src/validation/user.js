'use strict';

var fp = require('lodash/fp');
var utils = require('@strapi/utils');
var commonValidators = require('./common-validators.js');

const userCreationSchema = utils.yup.object().shape({
    email: commonValidators.default.email.required(),
    firstname: commonValidators.default.firstname.required(),
    lastname: commonValidators.default.lastname,
    roles: commonValidators.default.roles.min(1),
    preferedLanguage: utils.yup.string().nullable()
}).noUnknown();
const profileUpdateSchema = utils.yup.object().shape({
    email: commonValidators.default.email.notNull(),
    firstname: commonValidators.default.firstname.notNull(),
    lastname: commonValidators.default.lastname.nullable(),
    username: commonValidators.default.username.nullable(),
    password: commonValidators.default.password.notNull(),
    currentPassword: utils.yup.string().when('password', (password, schema)=>!fp.isUndefined(password) ? schema.required() : schema).notNull(),
    preferedLanguage: utils.yup.string().nullable()
}).noUnknown();
const userUpdateSchema = utils.yup.object().shape({
    email: commonValidators.default.email.notNull(),
    firstname: commonValidators.default.firstname.notNull(),
    lastname: commonValidators.default.lastname.nullable(),
    username: commonValidators.default.username.nullable(),
    password: commonValidators.default.password.notNull(),
    isActive: utils.yup.bool().notNull(),
    roles: commonValidators.default.roles.min(1).notNull()
}).noUnknown();
const usersDeleteSchema = utils.yup.object().shape({
    ids: utils.yup.array().of(utils.yup.strapiID()).min(1).required()
}).noUnknown();
const validateUserCreationInput = utils.validateYupSchema(userCreationSchema);
const validateProfileUpdateInput = utils.validateYupSchema(profileUpdateSchema);
const validateUserUpdateInput = utils.validateYupSchema(userUpdateSchema);
const validateUsersDeleteInput = utils.validateYupSchema(usersDeleteSchema);
const schemas = {
    userCreationSchema,
    usersDeleteSchema,
    userUpdateSchema
};

exports.schemas = schemas;
exports.validateProfileUpdateInput = validateProfileUpdateInput;
exports.validateUserCreationInput = validateUserCreationInput;
exports.validateUserUpdateInput = validateUserUpdateInput;
exports.validateUsersDeleteInput = validateUsersDeleteInput;
//# sourceMappingURL=user.js.map
