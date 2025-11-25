'use strict';

var fp = require('lodash/fp');
var strapiUtils = require('@strapi/utils');

const dtoFields = [
    'uid',
    'isDisplayed',
    'apiID',
    'kind',
    'category',
    'info',
    'options',
    'pluginOptions',
    'attributes',
    'pluginOptions'
];
var dataMapper = (()=>({
        toContentManagerModel (contentType) {
            return {
                ...contentType,
                apiID: contentType.modelName,
                isDisplayed: isVisible(contentType),
                attributes: {
                    id: {
                        type: 'integer'
                    },
                    ...formatAttributes(contentType),
                    documentId: {
                        type: 'string'
                    }
                }
            };
        },
        toDto: fp.pick(dtoFields)
    }));
const formatAttributes = (contentType)=>{
    const { getVisibleAttributes, getTimestamps, getCreatorFields } = strapiUtils.contentTypes;
    // only get attributes that can be seen in the auto generated Edit view or List view
    return getVisibleAttributes(contentType).concat(getTimestamps(contentType)).concat(getCreatorFields(contentType)).reduce((acc, key)=>{
        const attribute = contentType.attributes[key];
        // ignore morph until they are handled in the front
        if (attribute.type === 'relation' && attribute.relation.toLowerCase().includes('morph')) {
            return acc;
        }
        acc[key] = formatAttribute(key, attribute);
        return acc;
    }, {});
};
// FIXME: not needed
const formatAttribute = (key, attribute)=>{
    if (attribute.type === 'relation') {
        return toRelation(attribute);
    }
    return attribute;
};
// FIXME: not needed
const toRelation = (attribute)=>{
    return {
        ...attribute,
        type: 'relation',
        targetModel: 'target' in attribute ? attribute.target : undefined,
        relationType: attribute.relation
    };
};
const isVisible = (model)=>fp.getOr(true, 'pluginOptions.content-manager.visible', model) === true;

module.exports = dataMapper;
//# sourceMappingURL=data-mapper.js.map
