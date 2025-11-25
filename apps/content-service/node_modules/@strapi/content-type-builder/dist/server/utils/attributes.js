'use strict';

var _ = require('lodash');
var utils = require('@strapi/utils');

const { ApplicationError } = utils.errors;
const isConfigurable = (attribute)=>_.get(attribute, 'configurable', true);
const isRelation = (attribute)=>attribute.type === 'relation';
/**
 * Formats a component's attributes
 */ const formatAttributes = (model)=>{
    const { getVisibleAttributes } = utils.contentTypes;
    // only get attributes that can be seen in the CTB
    return getVisibleAttributes(model).reduce((acc, key)=>{
        acc[key] = formatAttribute(model.attributes[key]);
        return acc;
    }, {});
};
/**
 * Formats a component attribute
 */ const formatAttribute = (attribute)=>{
    const { configurable, required, autoPopulate, pluginOptions } = attribute;
    if (attribute.type === 'media') {
        return {
            type: 'media',
            multiple: !!attribute.multiple,
            required: !!required,
            configurable: configurable === false ? false : undefined,
            private: !!attribute.private,
            allowedTypes: attribute.allowedTypes,
            pluginOptions
        };
    }
    if (attribute.type === 'relation') {
        return {
            ...attribute,
            type: 'relation',
            target: attribute.target,
            targetAttribute: attribute.inversedBy || attribute.mappedBy || null,
            configurable: configurable === false ? false : undefined,
            private: !!attribute.private,
            pluginOptions,
            // TODO: remove
            autoPopulate
        };
    }
    return attribute;
};
// TODO: move to schema builder
const replaceTemporaryUIDs = (uidMap)=>(schema)=>{
        return {
            ...schema,
            attributes: Object.keys(schema.attributes).reduce((acc, key)=>{
                const attr = schema.attributes[key];
                if (attr.type === 'component') {
                    if (_.has(uidMap, attr.component)) {
                        acc[key] = {
                            ...attr,
                            component: uidMap[attr.component]
                        };
                        return acc;
                    }
                    if (!_.has(strapi.components, attr.component)) {
                        throw new ApplicationError('component.notFound');
                    }
                }
                if (attr.type === 'dynamiczone' && _.intersection(attr.components, Object.keys(uidMap)).length > 0) {
                    acc[key] = {
                        ...attr,
                        components: attr.components.map((value)=>{
                            if (_.has(uidMap, value)) return uidMap[value];
                            if (!_.has(strapi.components, value)) {
                                throw new ApplicationError('component.notFound');
                            }
                            return value;
                        })
                    };
                    return acc;
                }
                acc[key] = attr;
                return acc;
            }, {})
        };
    };

exports.formatAttribute = formatAttribute;
exports.formatAttributes = formatAttributes;
exports.isConfigurable = isConfigurable;
exports.isRelation = isRelation;
exports.replaceTemporaryUIDs = replaceTemporaryUIDs;
//# sourceMappingURL=attributes.js.map
