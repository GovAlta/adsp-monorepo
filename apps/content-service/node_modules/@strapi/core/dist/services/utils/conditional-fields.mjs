import { pipe, map, flatMap, values, sumBy } from 'lodash/fp';

const getNumberOfConditionalFields = ()=>{
    const contentTypes = strapi.contentTypes;
    const components = strapi.components;
    const countConditionalFieldsInSchema = (schema)=>{
        return pipe(map('attributes'), flatMap(values), sumBy((attribute)=>{
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

export { getNumberOfConditionalFields as default };
//# sourceMappingURL=conditional-fields.mjs.map
