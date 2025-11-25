'use strict';

var utils = require('@strapi/utils');
var fp = require('lodash/fp');
var index = require('../../utils/index.js');

const LOCALIZATION_FIELDS = [
    'locale',
    'localizations'
];
const sanitize = ({ strapi })=>{
    const { isLocalizedContentType } = index.getService('content-types');
    /**
   * Sanitizes localization fields of a given entity based on its schema.
   *
   * Remove localization-related fields that are unnecessary, that is
   * for schemas that aren't localized.
   */ const sanitizeLocalizationFields = fp.curry((schema, entity)=>utils.traverseEntity(({ key, schema }, { remove })=>{
            const isLocalized = isLocalizedContentType(schema);
            const isLocalizationField = LOCALIZATION_FIELDS.includes(key);
            if (!isLocalized && isLocalizationField) {
                remove(key);
            }
        }, {
            schema,
            getModel: strapi.getModel.bind(strapi)
        }, entity));
    return {
        sanitizeLocalizationFields
    };
};

module.exports = sanitize;
//# sourceMappingURL=index.js.map
