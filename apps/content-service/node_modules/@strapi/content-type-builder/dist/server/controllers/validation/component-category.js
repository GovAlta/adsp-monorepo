'use strict';

var utils = require('@strapi/utils');
var common = require('./common.js');

const componentCategorySchema = utils.yup.object({
    name: utils.yup.string().min(3).test(common.isValidCategoryName).required('name.required')
}).noUnknown();
var validateComponentCategory = utils.validateYupSchema(componentCategorySchema);

module.exports = validateComponentCategory;
//# sourceMappingURL=component-category.js.map
