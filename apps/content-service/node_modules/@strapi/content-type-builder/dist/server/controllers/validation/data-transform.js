'use strict';

var _ = require('lodash');
var typeguards = require('../../utils/typeguards.js');

const removeEmptyDefaults = (data)=>{
    const { attributes } = data || {};
    Object.keys(attributes).forEach((attributeName)=>{
        const attribute = attributes[attributeName];
        if (typeguards.hasDefaultAttribute(attribute) && attribute.default === '') {
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

exports.removeDeletedUIDTargetFields = removeDeletedUIDTargetFields;
exports.removeEmptyDefaults = removeEmptyDefaults;
//# sourceMappingURL=data-transform.js.map
