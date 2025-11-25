'use strict';

var _ = require('lodash');
var strapiUtils = require('@strapi/utils');
var blocksValidator = require('./blocks-validator.js');

/* Validator utils */ /**
 * Adds minLength validator
 */ const addMinLengthValidator = (validator, { attr }, { isDraft })=>{
    return attr.minLength && _.isInteger(attr.minLength) && !isDraft ? validator.min(attr.minLength) : validator;
};
/**
 * Adds maxLength validator
 * @returns {StringSchema}
 */ const addMaxLengthValidator = (validator, { attr })=>{
    return attr.maxLength && _.isInteger(attr.maxLength) ? validator.max(attr.maxLength) : validator;
};
/**
 * Adds min integer validator
 * @returns {NumberSchema}
 */ const addMinIntegerValidator = (validator, { attr }, { isDraft })=>_.isNumber(attr.min) && !isDraft ? validator.min(_.toInteger(attr.min)) : validator;
/**
 * Adds max integer validator
 */ const addMaxIntegerValidator = (validator, { attr })=>_.isNumber(attr.max) ? validator.max(_.toInteger(attr.max)) : validator;
/**
 * Adds min float/decimal validator
 */ const addMinFloatValidator = (validator, { attr }, { isDraft })=>_.isNumber(attr.min) && !isDraft ? validator.min(attr.min) : validator;
/**
 * Adds max float/decimal validator
 */ const addMaxFloatValidator = (validator, { attr })=>_.isNumber(attr.max) ? validator.max(attr.max) : validator;
/**
 * Adds regex validator
 */ const addStringRegexValidator = (validator, { attr }, { isDraft })=>{
    return 'regex' in attr && !_.isUndefined(attr.regex) && !isDraft ? validator.matches(new RegExp(attr.regex), {
        excludeEmptyString: !attr.required
    }) : validator;
};
const addUniqueValidator = (validator, { attr, model, updatedAttribute, entity, componentContext }, options)=>{
    if (attr.type !== 'uid' && !attr.unique) {
        return validator;
    }
    const validateUniqueFieldWithinComponent = async (value)=>{
        if (!componentContext) {
            return false;
        }
        // If we are validating a unique field within a repeatable component,
        // we first need to ensure that the repeatable in the current entity is
        // valid against itself.
        const hasRepeatableData = componentContext.repeatableData.length > 0;
        if (hasRepeatableData) {
            const { name: updatedName, value: updatedValue } = updatedAttribute;
            // Construct the full path to the unique field within the component.
            const pathToCheck = [
                ...componentContext.pathToComponent.slice(1),
                updatedName
            ].join('.');
            // Extract the values from the repeatable data using the constructed path
            const values = componentContext.repeatableData.map((item)=>{
                return pathToCheck.split('.').reduce((acc, key)=>acc[key], item);
            });
            // Check if the value is repeated in the current entity
            const isUpdatedAttributeRepeatedInThisEntity = values.filter((value)=>value === updatedValue).length > 1;
            if (isUpdatedAttributeRepeatedInThisEntity) {
                return false;
            }
        }
        /**
     * When `componentContext` is present it means we are dealing with a unique
     * field within a component.
     *
     * The unique validation must consider the specific context of the
     * component, which will always be contained within a parent content type
     * and may also be nested within another component.
     *
     * We construct a query that takes into account the parent's model UID,
     * dimensions (such as draft and publish state/locale) and excludes the current
     * content type entity by its ID if provided.
     */ const { model: parentModel, options: parentOptions, id: excludeId } = componentContext.parentContent;
        const whereConditions = {};
        const isParentDraft = parentOptions && parentOptions.isDraft;
        whereConditions.publishedAt = isParentDraft ? null : {
            $notNull: true
        };
        if (parentOptions?.locale) {
            whereConditions.locale = parentOptions.locale;
        }
        if (excludeId && !Number.isNaN(excludeId)) {
            whereConditions.id = {
                $ne: excludeId
            };
        }
        const queryUid = parentModel.uid;
        const queryWhere = {
            ...componentContext.pathToComponent.reduceRight((acc, key)=>({
                    [key]: acc
                }), {
                [updatedAttribute.name]: value
            }),
            ...whereConditions
        };
        // The validation should pass if there is no other record found from the query
        return !await strapi.db.query(queryUid).findOne({
            where: queryWhere
        });
    };
    const validateUniqueFieldWithinDynamicZoneComponent = async (startOfPath)=>{
        if (!componentContext) {
            return false;
        }
        const targetComponentUID = model.uid;
        // Ensure that the value is unique within the dynamic zone in this entity.
        const countOfValueInThisEntity = (componentContext?.fullDynamicZoneContent ?? []).reduce((acc, component)=>{
            if (component.__component !== targetComponentUID) {
                return acc;
            }
            const updatedValue = component[updatedAttribute.name];
            return updatedValue === updatedAttribute.value ? acc + 1 : acc;
        }, 0);
        if (countOfValueInThisEntity > 1) {
            // If the value is repeated in the current entity, the validation fails.
            return false;
        }
        // Populate the dynamic zone for any components that share the same value
        // as the updated attribute.
        const query = {
            select: [
                'id'
            ],
            where: {},
            populate: {
                [startOfPath]: {
                    on: {
                        [targetComponentUID]: {
                            select: [
                                'id'
                            ],
                            where: {
                                [updatedAttribute.name]: updatedAttribute.value
                            }
                        }
                    }
                }
            }
        };
        const { options, id } = componentContext.parentContent;
        if (options?.isDraft !== undefined) {
            query.where.published_at = options.isDraft ? {
                $eq: null
            } : {
                $ne: null
            };
        }
        if (id) {
            query.where.id = {
                $ne: id
            };
        }
        if (options?.locale) {
            query.where.locale = options.locale;
        }
        const parentModelQueryResult = await strapi.db.query(componentContext.parentContent.model.uid).findMany(query);
        // Filter the results to only include results that have components in the
        // dynamic zone that match the target component type.
        const filteredResults = parentModelQueryResult.filter((result)=>Array.isArray(result[startOfPath]) && result[startOfPath].length).flatMap((result)=>result[startOfPath]).filter((dynamicZoneComponent)=>dynamicZoneComponent.__component === targetComponentUID);
        if (filteredResults.length >= 1) {
            return false;
        }
        return true;
    };
    return validator.test('unique', 'This attribute must be unique', async (value)=>{
        /**
     * If the attribute value is `null` or an empty string we want to skip the unique validation.
     * Otherwise it'll only accept a single entry with that value in the database.
     */ if (_.isNil(value) || value === '') {
            return true;
        }
        /**
     * We don't validate any unique constraint for draft entries.
     */ if (options.isDraft) {
            return true;
        }
        const hasPathToComponent = componentContext && componentContext.pathToComponent.length > 0;
        if (hasPathToComponent) {
            // Detect if we are validating within a dynamiczone by checking if the first
            // path is a dynamiczone attribute in the parent content type.
            const startOfPath = componentContext.pathToComponent[0];
            const testingDZ = componentContext.parentContent.model.attributes[startOfPath].type === 'dynamiczone';
            if (testingDZ) {
                return validateUniqueFieldWithinDynamicZoneComponent(startOfPath);
            }
            return validateUniqueFieldWithinComponent(value);
        }
        /**
     * Here we are validating a scalar unique field from the content type's schema.
     * We construct a query to check if the value is unique
     * considering dimensions (e.g. locale, publication state) and excluding the current entity by its ID if available.
     */ const scalarAttributeWhere = {
            [updatedAttribute.name]: value,
            publishedAt: {
                $notNull: true
            }
        };
        if (options?.locale) {
            scalarAttributeWhere.locale = options.locale;
        }
        if (entity?.id) {
            scalarAttributeWhere.id = {
                $ne: entity.id
            };
        }
        // The validation should pass if there is no other record found from the query
        return !await strapi.db.query(model.uid).findOne({
            where: scalarAttributeWhere,
            select: [
                'id'
            ]
        });
    });
};
/* Type validators */ const stringValidator = (metas, options)=>{
    let schema = strapiUtils.yup.string().transform((val, originalVal)=>originalVal);
    schema = addMinLengthValidator(schema, metas, options);
    schema = addMaxLengthValidator(schema, metas);
    schema = addStringRegexValidator(schema, metas, options);
    schema = addUniqueValidator(schema, metas, options);
    return schema;
};
const emailValidator = (metas, options)=>{
    const schema = stringValidator(metas, options);
    if (options.isDraft) {
        return schema;
    }
    return schema.email().min(1, // eslint-disable-next-line no-template-curly-in-string
    '${path} cannot be empty');
};
const uidValidator = (metas, options)=>{
    const schema = stringValidator(metas, options);
    if (options.isDraft) {
        return schema;
    }
    if (metas.attr.regex) {
        return schema.matches(new RegExp(metas.attr.regex));
    }
    return schema.matches(/^[A-Za-z0-9-_.~]*$/);
};
const enumerationValidator = ({ attr })=>{
    return strapiUtils.yup.string().oneOf((Array.isArray(attr.enum) ? attr.enum : [
        attr.enum
    ]).concat(null));
};
const integerValidator = (metas, options)=>{
    let schema = strapiUtils.yup.number().integer();
    schema = addMinIntegerValidator(schema, metas, options);
    schema = addMaxIntegerValidator(schema, metas);
    schema = addUniqueValidator(schema, metas, options);
    return schema;
};
const floatValidator = (metas, options)=>{
    let schema = strapiUtils.yup.number();
    schema = addMinFloatValidator(schema, metas, options);
    schema = addMaxFloatValidator(schema, metas);
    schema = addUniqueValidator(schema, metas, options);
    return schema;
};
const bigintegerValidator = (metas, options)=>{
    const schema = strapiUtils.yup.mixed();
    return addUniqueValidator(schema, metas, options);
};
const datesValidator = (metas, options)=>{
    const schema = strapiUtils.yup.mixed();
    return addUniqueValidator(schema, metas, options);
};
const Validators = {
    string: stringValidator,
    text: stringValidator,
    richtext: stringValidator,
    password: stringValidator,
    email: emailValidator,
    enumeration: enumerationValidator,
    boolean: ()=>strapiUtils.yup.boolean(),
    uid: uidValidator,
    json: ()=>strapiUtils.yup.mixed(),
    integer: integerValidator,
    biginteger: bigintegerValidator,
    float: floatValidator,
    decimal: floatValidator,
    date: datesValidator,
    time: datesValidator,
    datetime: datesValidator,
    timestamp: datesValidator,
    blocks: blocksValidator.blocksValidator
};

exports.Validators = Validators;
exports.bigintegerValidator = bigintegerValidator;
exports.datesValidator = datesValidator;
exports.emailValidator = emailValidator;
exports.enumerationValidator = enumerationValidator;
exports.floatValidator = floatValidator;
exports.integerValidator = integerValidator;
exports.uidValidator = uidValidator;
//# sourceMappingURL=validators.js.map
