'use strict';

var utils = require('@strapi/utils');
var fp = require('lodash/fp');

const validateGetNonLocalizedAttributesSchema = utils.yup.object().shape({
    model: utils.yup.string().required(),
    id: utils.yup.mixed().when('model', {
        is: (model)=>fp.get('kind', strapi.contentType(model)) === 'singleType',
        then: utils.yup.strapiID().nullable(),
        otherwise: utils.yup.strapiID().required()
    }),
    locale: utils.yup.string().required()
}).noUnknown().required();
const validateGetNonLocalizedAttributesInput = utils.validateYupSchema(validateGetNonLocalizedAttributesSchema);

exports.validateGetNonLocalizedAttributesInput = validateGetNonLocalizedAttributesInput;
//# sourceMappingURL=content-types.js.map
