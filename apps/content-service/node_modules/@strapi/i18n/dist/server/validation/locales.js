'use strict';

var fp = require('lodash/fp');
var utils = require('@strapi/utils');
require('../constants/index.js');
var isoLocales = require('../constants/iso-locales.json.js');

const allowedLocaleCodes = isoLocales.map(fp.prop('code'));
const createLocaleSchema = utils.yup.object().shape({
    name: utils.yup.string().max(50).nullable(),
    code: utils.yup.string().oneOf(allowedLocaleCodes).required(),
    isDefault: utils.yup.boolean().required()
}).noUnknown();
const updateLocaleSchema = utils.yup.object().shape({
    name: utils.yup.string().min(1).max(50).nullable(),
    isDefault: utils.yup.boolean()
}).noUnknown();
const validateCreateLocaleInput = utils.validateYupSchema(createLocaleSchema);
const validateUpdateLocaleInput = utils.validateYupSchema(updateLocaleSchema);

exports.validateCreateLocaleInput = validateCreateLocaleInput;
exports.validateUpdateLocaleInput = validateUpdateLocaleInput;
//# sourceMappingURL=locales.js.map
