'use strict';

var strapiUtils = require('@strapi/utils');

const { CREATED_BY_ATTRIBUTE, UPDATED_BY_ATTRIBUTE } = strapiUtils.contentTypes.constants;
// We want to build a populate object based on the schema
const getDeepPopulate = (uid, opts = {})=>{
    const model = strapi.getModel(uid);
    const attributes = Object.entries(model.attributes);
    return attributes.reduce((acc, [attributeName, attribute])=>{
        switch(attribute.type){
            case 'relation':
                {
                    // TODO: Support polymorphic relations
                    const isMorphRelation = attribute.relation.toLowerCase().startsWith('morph');
                    if (isMorphRelation) {
                        break;
                    }
                    // Ignore not visible fields other than createdBy and updatedBy
                    const isVisible = strapiUtils.contentTypes.isVisibleAttribute(model, attributeName);
                    const isCreatorField = [
                        CREATED_BY_ATTRIBUTE,
                        UPDATED_BY_ATTRIBUTE
                    ].includes(attributeName);
                    if (isVisible || isCreatorField) {
                        acc[attributeName] = {
                            select: opts.relationalFields
                        };
                    }
                    break;
                }
            case 'media':
                {
                    // We populate all media fields for completeness of webhook responses
                    // see https://github.com/strapi/strapi/issues/21546
                    acc[attributeName] = {
                        select: [
                            '*'
                        ]
                    };
                    break;
                }
            case 'component':
                {
                    const populate = getDeepPopulate(attribute.component, opts);
                    acc[attributeName] = {
                        populate
                    };
                    break;
                }
            case 'dynamiczone':
                {
                    // Use fragments to populate the dynamic zone components
                    const populatedComponents = (attribute.components || []).reduce((acc, componentUID)=>{
                        acc[componentUID] = {
                            populate: getDeepPopulate(componentUID, opts)
                        };
                        return acc;
                    }, {});
                    acc[attributeName] = {
                        on: populatedComponents
                    };
                    break;
                }
        }
        return acc;
    }, {});
};

exports.getDeepPopulate = getDeepPopulate;
//# sourceMappingURL=populate.js.map
