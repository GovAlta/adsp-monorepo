'use strict';

var utils = require('@strapi/utils');
var constants = require('../../../constants.js');

const configSchema = utils.yup.object({
    pageSize: utils.yup.number().required(),
    sort: utils.yup.mixed().oneOf(constants.ALLOWED_SORT_STRINGS)
});
const validateViewConfiguration = utils.validateYupSchema(configSchema);

exports.validateViewConfiguration = validateViewConfiguration;
//# sourceMappingURL=configureView.js.map
