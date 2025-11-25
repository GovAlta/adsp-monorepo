'use strict';

var utils = require('@strapi/utils');

const settingsSchema = utils.yup.object({
    sizeOptimization: utils.yup.boolean().required(),
    responsiveDimensions: utils.yup.boolean().required(),
    autoOrientation: utils.yup.boolean(),
    aiMetadata: utils.yup.boolean().default(true)
});
var validateSettings = utils.validateYupSchema(settingsSchema);

module.exports = validateSettings;
//# sourceMappingURL=settings.js.map
