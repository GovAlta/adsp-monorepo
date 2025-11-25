'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var utils = require('@strapi/utils');
var constants = require('../../services/constants.js');

const transferTokenCreationSchema = utils.yup.object().shape({
    name: utils.yup.string().min(1).required(),
    description: utils.yup.string().optional(),
    permissions: utils.yup.array().min(1).of(utils.yup.string().oneOf(Object.values(constants.TRANSFER_TOKEN_TYPE))).required(),
    lifespan: utils.yup.number().min(1).oneOf(Object.values(constants.TRANSFER_TOKEN_LIFESPANS)).nullable()
}).noUnknown().strict();
const transferTokenUpdateSchema = utils.yup.object().shape({
    name: utils.yup.string().min(1).notNull(),
    description: utils.yup.string().nullable(),
    permissions: utils.yup.array().min(1).of(utils.yup.string().oneOf(Object.values(constants.TRANSFER_TOKEN_TYPE))).nullable()
}).noUnknown().strict();
const validateTransferTokenCreationInput = utils.validateYupSchema(transferTokenCreationSchema);
const validateTransferTokenUpdateInput = utils.validateYupSchema(transferTokenUpdateSchema);
var token = {
    validateTransferTokenCreationInput,
    validateTransferTokenUpdateInput
};

exports.default = token;
exports.validateTransferTokenCreationInput = validateTransferTokenCreationInput;
exports.validateTransferTokenUpdateInput = validateTransferTokenUpdateInput;
//# sourceMappingURL=token.js.map
