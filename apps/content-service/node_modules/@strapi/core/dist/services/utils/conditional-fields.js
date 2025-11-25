'use strict';

var fp = require('lodash/fp');

const getNumberOfConditionalFields = ()=>{
    const contentTypes = strapi.contentTypes;
    const components = strapi.components;
    const countConditionalFieldsInSchema = (schema)=>{
        return fp.pipe(fp.map('attributes'), fp.flatMap(fp.values), fp.sumBy((attribute)=>{
            if (attribute.conditions && typeof attribute.conditions === 'object') {
                return 1;
            }
            return 0;
        }))(schema);
    };
    const contentTypeCount = countConditionalFieldsInSchema(contentTypes);
    const componentCount = countConditionalFieldsInSchema(components);
    return contentTypeCount + componentCount;
};

module.exports = getNumberOfConditionalFields;
//# sourceMappingURL=conditional-fields.js.map
