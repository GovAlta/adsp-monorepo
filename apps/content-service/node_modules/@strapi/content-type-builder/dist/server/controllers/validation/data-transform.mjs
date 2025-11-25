import _ from 'lodash';
import { hasDefaultAttribute } from '../../utils/typeguards.mjs';

const removeEmptyDefaults = (data)=>{
    const { attributes } = data || {};
    Object.keys(attributes).forEach((attributeName)=>{
        const attribute = attributes[attributeName];
        if (hasDefaultAttribute(attribute) && attribute.default === '') {
            attribute.default = undefined;
        }
    });
};
const removeDeletedUIDTargetFields = (data)=>{
    if (_.has(data, 'attributes')) {
        Object.values(data.attributes).forEach((attribute)=>{
            if (attribute.type === 'uid' && !_.isUndefined(attribute.targetField) && !_.has(data.attributes, attribute.targetField)) {
                attribute.targetField = undefined;
            }
        });
    }
};

export { removeDeletedUIDTargetFields, removeEmptyDefaults };
//# sourceMappingURL=data-transform.mjs.map
