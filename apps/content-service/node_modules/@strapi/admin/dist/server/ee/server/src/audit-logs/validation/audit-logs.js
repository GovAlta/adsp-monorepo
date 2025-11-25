'use strict';

var utils = require('@strapi/utils');

const ALLOWED_SORT_STRINGS = [
    'action:ASC',
    'action:DESC',
    'date:ASC',
    'date:DESC'
];
const validateFindManySchema = utils.yup.object().shape({
    page: utils.yup.number().integer().min(1),
    pageSize: utils.yup.number().integer().min(1).max(100),
    sort: utils.yup.mixed().oneOf(ALLOWED_SORT_STRINGS)
}).required();
const validateFindMany = utils.validateYupSchema(validateFindManySchema, {
    strict: false
});

exports.validateFindMany = validateFindMany;
//# sourceMappingURL=audit-logs.js.map
