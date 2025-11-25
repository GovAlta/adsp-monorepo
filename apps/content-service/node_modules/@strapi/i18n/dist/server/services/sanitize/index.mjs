import { traverseEntity } from '@strapi/utils';
import { curry } from 'lodash/fp';
import { getService } from '../../utils/index.mjs';

const LOCALIZATION_FIELDS = [
    'locale',
    'localizations'
];
const sanitize = ({ strapi })=>{
    const { isLocalizedContentType } = getService('content-types');
    /**
   * Sanitizes localization fields of a given entity based on its schema.
   *
   * Remove localization-related fields that are unnecessary, that is
   * for schemas that aren't localized.
   */ const sanitizeLocalizationFields = curry((schema, entity)=>traverseEntity(({ key, schema }, { remove })=>{
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

export { sanitize as default };
//# sourceMappingURL=index.mjs.map
