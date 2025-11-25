'use strict';

var _ = require('lodash');
var fp = require('lodash/fp');
var utils = require('@strapi/utils');
var index = require('../utils/index.js');

const { isRelationalAttribute, getVisibleAttributes, isTypedAttribute, getScalarAttributes, getRelationalAttributes } = utils.contentTypes;
const { ApplicationError } = utils.errors;
const hasLocalizedOption = (modelOrAttribute)=>{
    return fp.prop('pluginOptions.i18n.localized', modelOrAttribute) === true;
};
const getValidLocale = async (locale)=>{
    const localesService = index.getService('locales');
    if (fp.isNil(locale)) {
        return localesService.getDefaultLocale();
    }
    const foundLocale = await localesService.findByCode(locale);
    if (!foundLocale) {
        throw new ApplicationError('Locale not found');
    }
    return locale;
};
/**
 * Returns whether an attribute is localized or not
 * @param {*} attribute
 * @returns
 */ const isLocalizedAttribute = (attribute)=>{
    return hasLocalizedOption(attribute) || isRelationalAttribute(attribute) || isTypedAttribute(attribute, 'uid');
};
/**
 * Returns whether a model is localized or not
 * @param {*} model
 * @returns
 */ const isLocalizedContentType = (model)=>{
    return hasLocalizedOption(model);
};
/**
 * Returns the list of attribute names that are not localized
 * @param {object} model
 * @returns {string[]}
 */ const getNonLocalizedAttributes = (model)=>{
    return getVisibleAttributes(model).filter((attrName)=>!isLocalizedAttribute(model.attributes[attrName]));
};
const removeId = (value)=>{
    if (typeof value === 'object' && fp.has('id', value)) {
        delete value.id;
    }
};
const removeIds = (model)=>(entry)=>removeIdsMut(model, fp.cloneDeep(entry));
const removeIdsMut = (model, entry)=>{
    if (fp.isNil(entry)) {
        return entry;
    }
    removeId(entry);
    _.forEach(model.attributes, (attr, attrName)=>{
        const value = entry[attrName];
        if (attr.type === 'dynamiczone' && fp.isArray(value)) {
            value.forEach((compo)=>{
                if (fp.has('__component', compo)) {
                    const model = strapi.components[compo.__component];
                    removeIdsMut(model, compo);
                }
            });
        } else if (attr.type === 'component') {
            const model = strapi.components[attr.component];
            if (fp.isArray(value)) {
                value.forEach((compo)=>removeIdsMut(model, compo));
            } else {
                removeIdsMut(model, value);
            }
        }
    });
    return entry;
};
/**
 * Returns a copy of an entry picking only its non localized attributes
 * @param {object} model
 * @param {object} entry
 * @returns {object}
 */ const copyNonLocalizedAttributes = (model, entry)=>{
    const nonLocalizedAttributes = getNonLocalizedAttributes(model);
    return fp.pipe(fp.pick(nonLocalizedAttributes), removeIds(model))(entry);
};
/**
 * Returns the list of attribute names that are localized
 * @param {object} model
 * @returns {string[]}
 */ const getLocalizedAttributes = (model)=>{
    return getVisibleAttributes(model).filter((attrName)=>isLocalizedAttribute(model.attributes[attrName]));
};
/**
 * Fill non localized fields of an entry if there are nil
 * @param {Object} entry entry to fill
 * @param {Object} relatedEntry values used to fill
 * @param {Object} options
 * @param {Object} options.model corresponding model
 */ const fillNonLocalizedAttributes = (entry, relatedEntry, { model })=>{
    if (fp.isNil(relatedEntry)) {
        return;
    }
    const modelDef = strapi.getModel(model);
    const relatedEntryCopy = copyNonLocalizedAttributes(modelDef, relatedEntry);
    _.forEach(relatedEntryCopy, (value, field)=>{
        if (fp.isNil(entry[field])) {
            entry[field] = value;
        }
    });
};
/**
 * build the populate param to
 * @param {String} modelUID uid of the model, could be of a content-type or a component
 */ const getNestedPopulateOfNonLocalizedAttributes = (modelUID)=>{
    const schema = strapi.getModel(modelUID);
    const scalarAttributes = getScalarAttributes(schema);
    const nonLocalizedAttributes = getNonLocalizedAttributes(schema);
    const allAttributes = [
        ...scalarAttributes,
        ...nonLocalizedAttributes
    ];
    if (schema.modelType === 'component') {
        // When called recursively on a non localized component we
        // need to explicitly populate that components relations
        allAttributes.push(...getRelationalAttributes(schema));
    }
    const currentAttributesToPopulate = allAttributes.filter((value, index, self)=>{
        return self.indexOf(value) === index && self.lastIndexOf(value) === index;
    });
    const attributesToPopulate = [
        ...currentAttributesToPopulate
    ];
    for (const attrName of currentAttributesToPopulate){
        const attr = schema.attributes[attrName];
        if (attr.type === 'component') {
            const nestedPopulate = getNestedPopulateOfNonLocalizedAttributes(attr.component).map((nestedAttr)=>`${attrName}.${nestedAttr}`);
            attributesToPopulate.push(...nestedPopulate);
        } else if (attr.type === 'dynamiczone') {
            attr.components.forEach((componentName)=>{
                const nestedPopulate = getNestedPopulateOfNonLocalizedAttributes(componentName).map((nestedAttr)=>`${attrName}.${nestedAttr}`);
                attributesToPopulate.push(...nestedPopulate);
            });
        }
    }
    return attributesToPopulate;
};
const contentTypes = ()=>({
        isLocalizedContentType,
        getValidLocale,
        getLocalizedAttributes,
        getNonLocalizedAttributes,
        copyNonLocalizedAttributes,
        fillNonLocalizedAttributes,
        getNestedPopulateOfNonLocalizedAttributes
    });

module.exports = contentTypes;
//# sourceMappingURL=content-types.js.map
