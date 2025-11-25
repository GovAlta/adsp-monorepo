'use strict';

var utils = require('@strapi/utils');
var constants = require('../services/constants.js');

const apiTokenCreationSchema = utils.yup.object().shape({
    name: utils.yup.string().min(1).required(),
    description: utils.yup.string().optional(),
    type: utils.yup.string().oneOf(Object.values(constants.API_TOKEN_TYPE)).required(),
    permissions: utils.yup.array().of(utils.yup.string()).nullable(),
    lifespan: utils.yup.number().min(1).oneOf(Object.values(constants.API_TOKEN_LIFESPANS)).nullable()
}).noUnknown().strict();
const apiTokenUpdateSchema = utils.yup.object().shape({
    name: utils.yup.string().min(1).notNull(),
    description: utils.yup.string().nullable(),
    type: utils.yup.string().oneOf(Object.values(constants.API_TOKEN_TYPE)).notNull(),
    permissions: utils.yup.array().of(utils.yup.string()).nullable()
}).noUnknown().strict();
const validateApiTokenCreationInput = utils.validateYupSchema(apiTokenCreationSchema);
const validateApiTokenUpdateInput = utils.validateYupSchema(apiTokenUpdateSchema);

exports.validateApiTokenCreationInput = validateApiTokenCreationInput;
exports.validateApiTokenUpdateInput = validateApiTokenUpdateInput;
//# sourceMappingURL=api-tokens.js.map
