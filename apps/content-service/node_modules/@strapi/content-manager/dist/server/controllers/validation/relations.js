'use strict';

var strapiUtils = require('@strapi/utils');

const validateFindAvailableSchema = strapiUtils.yup.object().shape({
    component: strapiUtils.yup.string(),
    id: strapiUtils.yup.strapiID(),
    _q: strapiUtils.yup.string(),
    idsToOmit: strapiUtils.yup.array().of(strapiUtils.yup.strapiID()),
    idsToInclude: strapiUtils.yup.array().of(strapiUtils.yup.strapiID()),
    page: strapiUtils.yup.number().integer().min(1),
    pageSize: strapiUtils.yup.number().integer().min(1).max(100),
    locale: strapiUtils.yup.string().nullable(),
    status: strapiUtils.yup.string().oneOf([
        'published',
        'draft'
    ]).nullable()
}).required();
const validateFindExistingSchema = strapiUtils.yup.object().shape({
    page: strapiUtils.yup.number().integer().min(1),
    pageSize: strapiUtils.yup.number().integer().min(1).max(100),
    locale: strapiUtils.yup.string().nullable(),
    status: strapiUtils.yup.string().oneOf([
        'published',
        'draft'
    ]).nullable()
}).required();
const validateFindAvailable = strapiUtils.validateYupSchema(validateFindAvailableSchema, {
    strict: false
});
const validateFindExisting = strapiUtils.validateYupSchema(validateFindExistingSchema, {
    strict: false
});

exports.validateFindAvailable = validateFindAvailable;
exports.validateFindExisting = validateFindExisting;
//# sourceMappingURL=relations.js.map
