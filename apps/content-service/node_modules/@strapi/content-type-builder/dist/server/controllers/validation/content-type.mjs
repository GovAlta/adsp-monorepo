import { has, getOr, flatMap, snakeCase } from 'lodash/fp';
import { yup, validateYupSchema } from '@strapi/utils';
import { getService } from '../../utils/index.mjs';
import { typeKinds, modelTypes, DEFAULT_TYPES } from '../../services/constants.mjs';
import { createSchema } from './model-schema.mjs';
import { removeEmptyDefaults, removeDeletedUIDTargetFields } from './data-transform.mjs';
import { nestedComponentSchema } from './component.mjs';

/* eslint-disable no-template-curly-in-string */ // yup templates need to be in this format
/**
 * Allowed relation per type kind
 */ const VALID_RELATIONS = {
    [typeKinds.SINGLE_TYPE]: [
        'oneToOne',
        'oneToMany',
        'morphOne',
        'morphMany',
        'morphToOne',
        'morphToMany'
    ],
    [typeKinds.COLLECTION_TYPE]: [
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
    ...DEFAULT_TYPES,
    'uid',
    'component',
    'dynamiczone',
    'customField'
];
/**
 * Returns a yup schema to validate a content type payload
 */ const createContentTypeSchema = (data, { isEdition = false } = {})=>{
    const kind = getOr(typeKinds.COLLECTION_TYPE, 'contentType.kind', data);
    const contentTypeSchema = createSchema(VALID_TYPES, VALID_RELATIONS[kind] || [], {
        modelType: modelTypes.CONTENT_TYPE
    }).shape({
        displayName: yup.string().min(1).required(),
        singularName: yup.string().min(1).test(nameIsAvailable(isEdition)).test(forbiddenContentTypeNameValidator()).isKebabCase().required(),
        pluralName: yup.string().min(1).test(nameIsAvailable(isEdition)).test(nameIsNotExistingCollectionName(isEdition)) // TODO: v5: require singularName to not match a collection name
        .test(forbiddenContentTypeNameValidator()).isKebabCase().required()
    }).test('singularName-not-equal-pluralName', '${path}: singularName and pluralName should be different', (value)=>value.singularName !== value.pluralName);
    return yup.object({
        // FIXME .noUnknown(false) will strip off the unwanted properties without throwing an error
        // Why not having .noUnknown() ? Because we want to be able to add options relatable to EE features
        // without having any reference to them in CE.
        // Why not handle an "options" object in the content-type ? The admin panel needs lots of rework
        // to be able to send this options object instead of top-level attributes.
        // @nathan-pichon 20/02/2023
        contentType: contentTypeSchema.required().noUnknown(false),
        components: nestedComponentSchema
    }).noUnknown();
};
/**
 * Validator for content type creation
 */ const validateContentTypeInput = (data)=>{
    return validateYupSchema(createContentTypeSchema(data))(data);
};
/**
 * Validator for content type edition
 */ const validateUpdateContentTypeInput = (data)=>{
    if (has('contentType', data)) {
        removeEmptyDefaults(data.contentType);
        removeDeletedUIDTargetFields(data.contentType);
    }
    if (has('components', data) && Array.isArray(data.components)) {
        data.components.forEach((comp)=>{
            if (has('uid', comp)) {
                removeEmptyDefaults(comp);
            }
        });
    }
    return validateYupSchema(createContentTypeSchema(data, {
        isEdition: true
    }))(data);
};
const forbiddenContentTypeNameValidator = ()=>{
    const reservedNames = getService('builder').getReservedNames().models;
    return {
        name: 'forbiddenContentTypeName',
        message: `Content Type name cannot be one of ${reservedNames.join(', ')}`,
        test (value) {
            if (typeof value !== 'string') {
                return true;
            }
            return !getService('builder').isReservedModelName(value);
        }
    };
};
const nameIsAvailable = (isEdition)=>{
    // TODO TS: if strapi.contentTypes (ie, ContentTypes) works as an ArrayLike and is used like this, we may want to ensure it is typed so that it can be without using as
    const usedNames = flatMap((ct)=>{
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
            return usedNames.every((usedName)=>snakeCase(usedName) !== snakeCase(value));
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
            return usedNames.every((usedName)=>snakeCase(usedName) !== snakeCase(value));
        }
    };
};
/**
 * Validates type kind
 */ const kindSchema = yup.string().oneOf([
    typeKinds.SINGLE_TYPE,
    typeKinds.COLLECTION_TYPE
]);
const validateKind = validateYupSchema(kindSchema);

export { validateContentTypeInput, validateKind, validateUpdateContentTypeInput };
//# sourceMappingURL=content-type.mjs.map
