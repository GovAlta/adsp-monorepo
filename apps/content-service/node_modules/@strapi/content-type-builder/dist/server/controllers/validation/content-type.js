'use strict';

var fp = require('lodash/fp');
var utils = require('@strapi/utils');
var index = require('../../utils/index.js');
var constants = require('../../services/constants.js');
var modelSchema = require('./model-schema.js');
var dataTransform = require('./data-transform.js');
var component = require('./component.js');

/* eslint-disable no-template-curly-in-string */ // yup templates need to be in this format
/**
 * Allowed relation per type kind
 */ const VALID_RELATIONS = {
    [constants.typeKinds.SINGLE_TYPE]: [
        'oneToOne',
        'oneToMany',
        'morphOne',
        'morphMany',
        'morphToOne',
        'morphToMany'
    ],
    [constants.typeKinds.COLLECTION_TYPE]: [
        'oneToOne',
        'oneToMany',
        'manyToOne',
        'manyToMany',
        'morphOne',
        'morphMany',
        'morphToOne',
        'morphToMany'
    ]
};
/**
 * Allowed types
 */ const VALID_TYPES = [
    ...constants.DEFAULT_TYPES,
    'uid',
    'component',
    'dynamiczone',
    'customField'
];
/**
 * Returns a yup schema to validate a content type payload
 */ const createContentTypeSchema = (data, { isEdition = false } = {})=>{
    const kind = fp.getOr(constants.typeKinds.COLLECTION_TYPE, 'contentType.kind', data);
    const contentTypeSchema = modelSchema.createSchema(VALID_TYPES, VALID_RELATIONS[kind] || [], {
        modelType: constants.modelTypes.CONTENT_TYPE
    }).shape({
        displayName: utils.yup.string().min(1).required(),
        singularName: utils.yup.string().min(1).test(nameIsAvailable(isEdition)).test(forbiddenContentTypeNameValidator()).isKebabCase().required(),
        pluralName: utils.yup.string().min(1).test(nameIsAvailable(isEdition)).test(nameIsNotExistingCollectionName(isEdition)) // TODO: v5: require singularName to not match a collection name
        .test(forbiddenContentTypeNameValidator()).isKebabCase().required()
    }).test('singularName-not-equal-pluralName', '${path}: singularName and pluralName should be different', (value)=>value.singularName !== value.pluralName);
    return utils.yup.object({
        // FIXME .noUnknown(false) will strip off the unwanted properties without throwing an error
        // Why not having .noUnknown() ? Because we want to be able to add options relatable to EE features
        // without having any reference to them in CE.
        // Why not handle an "options" object in the content-type ? The admin panel needs lots of rework
        // to be able to send this options object instead of top-level attributes.
        // @nathan-pichon 20/02/2023
        contentType: contentTypeSchema.required().noUnknown(false),
        components: component.nestedComponentSchema
    }).noUnknown();
};
/**
 * Validator for content type creation
 */ const validateContentTypeInput = (data)=>{
    return utils.validateYupSchema(createContentTypeSchema(data))(data);
};
/**
 * Validator for content type edition
 */ const validateUpdateContentTypeInput = (data)=>{
    if (fp.has('contentType', data)) {
        dataTransform.removeEmptyDefaults(data.contentType);
        dataTransform.removeDeletedUIDTargetFields(data.contentType);
    }
    if (fp.has('components', data) && Array.isArray(data.components)) {
        data.components.forEach((comp)=>{
            if (fp.has('uid', comp)) {
                dataTransform.removeEmptyDefaults(comp);
            }
        });
    }
    return utils.validateYupSchema(createContentTypeSchema(data, {
        isEdition: true
    }))(data);
};
const forbiddenContentTypeNameValidator = ()=>{
    const reservedNames = index.getService('builder').getReservedNames().models;
    return {
        name: 'forbiddenContentTypeName',
        message: `Content Type name cannot be one of ${reservedNames.join(', ')}`,
        test (value) {
            if (typeof value !== 'string') {
                return true;
            }
            return !index.getService('builder').isReservedModelName(value);
        }
    };
};
const nameIsAvailable = (isEdition)=>{
    // TODO TS: if strapi.contentTypes (ie, ContentTypes) works as an ArrayLike and is used like this, we may want to ensure it is typed so that it can be without using as
    const usedNames = fp.flatMap((ct)=>{
        return [
            ct.info?.singularName,
            ct.info?.pluralName
        ];
    })(strapi.contentTypes);
    return {
        name: 'nameAlreadyUsed',
        message: 'contentType: name `${value}` is already being used by another content type.',
        test (value) {
            // don't check on edition
            if (isEdition) return true;
            // ignore if not a string (will be caught in another validator)
            if (typeof value !== 'string') {
                return true;
            }
            // compare snake case to check the actual column names that will be used in the database
            return usedNames.every((usedName)=>fp.snakeCase(usedName) !== fp.snakeCase(value));
        }
    };
};
const nameIsNotExistingCollectionName = (isEdition)=>{
    const usedNames = Object.keys(strapi.contentTypes).map((key)=>strapi.contentTypes[key].collectionName);
    return {
        name: 'nameAlreadyUsed',
        message: 'contentType: name `${value}` is already being used by another content type.',
        test (value) {
            // don't check on edition
            if (isEdition) return true;
            // ignore if not a string (will be caught in another validator)
            if (typeof value !== 'string') {
                return true;
            }
            // compare snake case to check the actual column names that will be used in the database
            return usedNames.every((usedName)=>fp.snakeCase(usedName) !== fp.snakeCase(value));
        }
    };
};
/**
 * Validates type kind
 */ const kindSchema = utils.yup.string().oneOf([
    constants.typeKinds.SINGLE_TYPE,
    constants.typeKinds.COLLECTION_TYPE
]);
const validateKind = utils.validateYupSchema(kindSchema);

exports.validateContentTypeInput = validateContentTypeInput;
exports.validateKind = validateKind;
exports.validateUpdateContentTypeInput = validateUpdateContentTypeInput;
//# sourceMappingURL=content-type.js.map
