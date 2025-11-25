'use strict';

var _ = require('lodash');
var fp = require('lodash/fp');
var jsonLogic = require('json-logic-js');
var strapiUtils = require('@strapi/utils');
var validators = require('./validators.js');

const { yup, validateYupSchema } = strapiUtils;
const { isMediaAttribute, isScalarAttribute, getWritableAttributes } = strapiUtils.contentTypes;
const { ValidationError } = strapiUtils.errors;
const isInteger = (value)=>Number.isInteger(value);
const addMinMax = (validator, { attr, updatedAttribute })=>{
    let nextValidator = validator;
    if (isInteger(attr.min) && ('required' in attr && attr.required || Array.isArray(updatedAttribute.value) && updatedAttribute.value.length > 0)) {
        nextValidator = nextValidator.min(attr.min);
    }
    if (isInteger(attr.max)) {
        nextValidator = nextValidator.max(attr.max);
    }
    return nextValidator;
};
const addRequiredValidation = (createOrUpdate)=>{
    return (validator, { attr: { required } })=>{
        let nextValidator = validator;
        if (required) {
            if (createOrUpdate === 'creation') {
                nextValidator = nextValidator.notNil();
            } else if (createOrUpdate === 'update') {
                nextValidator = nextValidator.notNull();
            }
        } else {
            nextValidator = nextValidator.nullable();
        }
        return nextValidator;
    };
};
const addDefault = (createOrUpdate)=>{
    return (validator, { attr })=>{
        let nextValidator = validator;
        if (createOrUpdate === 'creation') {
            if ((attr.type === 'component' && attr.repeatable || attr.type === 'dynamiczone') && !attr.required) {
                nextValidator = nextValidator.default([]);
            } else {
                nextValidator = nextValidator.default(attr.default);
            }
        } else {
            nextValidator = nextValidator.default(undefined);
        }
        return nextValidator;
    };
};
const preventCast = (validator)=>validator.transform((val, originalVal)=>originalVal);
const createComponentValidator = (createOrUpdate)=>({ attr, updatedAttribute, componentContext }, { isDraft })=>{
        const model = strapi.getModel(attr.component);
        if (!model) {
            throw new Error('Validation failed: Model not found');
        }
        if (attr?.repeatable) {
            // FIXME: yup v1
            let validator = yup.array().of(yup.lazy((item)=>createModelValidator(createOrUpdate)({
                    componentContext,
                    model,
                    data: item
                }, {
                    isDraft
                }).notNull()));
            validator = addRequiredValidation(createOrUpdate)(validator, {
                attr: {
                    required: true
                },
                updatedAttribute
            });
            if (!isDraft) {
                validator = addMinMax(validator, {
                    attr,
                    updatedAttribute
                });
            }
            return validator;
        }
        let validator = createModelValidator(createOrUpdate)({
            model,
            data: updatedAttribute.value,
            componentContext
        }, {
            isDraft
        });
        validator = addRequiredValidation(createOrUpdate)(validator, {
            attr: {
                required: !isDraft && attr.required
            },
            updatedAttribute
        });
        return validator;
    };
const createDzValidator = (createOrUpdate)=>({ attr, updatedAttribute, componentContext }, { isDraft })=>{
        let validator;
        validator = yup.array().of(yup.lazy((item)=>{
            const model = strapi.getModel(fp.prop('__component', item));
            const schema = yup.object().shape({
                __component: yup.string().required().oneOf(Object.keys(strapi.components))
            }).notNull();
            return model ? schema.concat(createModelValidator(createOrUpdate)({
                model,
                data: item,
                componentContext
            }, {
                isDraft
            })) : schema;
        }));
        validator = addRequiredValidation(createOrUpdate)(validator, {
            attr: {
                required: true
            },
            updatedAttribute
        });
        if (!isDraft) {
            validator = addMinMax(validator, {
                attr,
                updatedAttribute
            });
        }
        return validator;
    };
const createRelationValidator = ({ updatedAttribute })=>{
    let validator;
    if (Array.isArray(updatedAttribute.value)) {
        validator = yup.array().of(yup.mixed());
    } else {
        validator = yup.mixed();
    }
    return validator;
};
const createScalarAttributeValidator = (createOrUpdate)=>(metas, options)=>{
        let validator;
        if (fp.has(metas.attr.type, validators.Validators)) {
            validator = validators.Validators[metas.attr.type](metas, options);
        } else {
            // No validators specified - fall back to mixed
            validator = yup.mixed();
        }
        validator = addRequiredValidation(createOrUpdate)(validator, {
            attr: {
                required: !options.isDraft && metas.attr.required
            },
            updatedAttribute: metas.updatedAttribute
        });
        return validator;
    };
const createAttributeValidator = (createOrUpdate)=>(metas, options)=>{
        let validator = yup.mixed();
        // If field is conditionally invisible, skip all validation for it
        if (metas.attr.conditions?.visible) {
            const isVisible = jsonLogic.apply(metas.attr.conditions.visible, metas.data);
            if (!isVisible) {
                return yup.mixed().notRequired(); // Completely skip validation
            }
        }
        if (isMediaAttribute(metas.attr)) {
            validator = yup.mixed();
        } else if (isScalarAttribute(metas.attr)) {
            validator = createScalarAttributeValidator(createOrUpdate)(metas, options);
        } else {
            if (metas.attr.type === 'component' && metas.componentContext) {
                // Build the path to the component within the parent content type schema.
                const pathToComponent = [
                    ...metas?.componentContext?.pathToComponent ?? [],
                    metas.updatedAttribute.name
                ];
                // If working with a repeatable component, determine the repeatable data
                // based on the component's path.
                // In order to validate the repeatable within this entity we need
                // access to the full repeatable data. In case we are validating a
                // nested component within a repeatable.
                // Hence why we set this up when the path to the component is only one level deep.
                const repeatableData = metas.attr.repeatable && pathToComponent.length === 1 ? metas.updatedAttribute.value : metas.componentContext?.repeatableData;
                const newComponentContext = {
                    ...metas.componentContext,
                    pathToComponent,
                    repeatableData
                };
                validator = createComponentValidator(createOrUpdate)({
                    componentContext: newComponentContext,
                    attr: metas.attr,
                    updatedAttribute: metas.updatedAttribute
                }, options);
            } else if (metas.attr.type === 'dynamiczone' && metas.componentContext) {
                const newComponentContext = {
                    ...metas.componentContext,
                    fullDynamicZoneContent: metas.updatedAttribute.value,
                    pathToComponent: [
                        ...metas.componentContext.pathToComponent,
                        metas.updatedAttribute.name
                    ]
                };
                Object.assign(metas, {
                    componentContext: newComponentContext
                });
                validator = createDzValidator(createOrUpdate)(metas, options);
            } else if (metas.attr.type === 'relation') {
                validator = createRelationValidator({
                    attr: metas.attr,
                    updatedAttribute: metas.updatedAttribute
                });
            }
            validator = preventCast(validator);
        }
        validator = addDefault(createOrUpdate)(validator, metas);
        return validator;
    };
const createModelValidator = (createOrUpdate)=>({ componentContext, model, data, entity }, options)=>{
        const writableAttributes = model ? getWritableAttributes(model) : [];
        const schema = writableAttributes.reduce((validators, attributeName)=>{
            const metas = {
                attr: model.attributes[attributeName],
                updatedAttribute: {
                    name: attributeName,
                    value: fp.prop(attributeName, data)
                },
                data,
                model,
                entity,
                componentContext
            };
            const validator = createAttributeValidator(createOrUpdate)(metas, options);
            validators[attributeName] = validator;
            return validators;
        }, {});
        return yup.object().shape(schema);
    };
const createValidateEntity = (createOrUpdate)=>{
    return async (model, data, options, entity)=>{
        if (!fp.isObject(data)) {
            const { displayName } = model.info;
            throw new ValidationError(`Invalid payload submitted for the ${createOrUpdate} of an entity of type ${displayName}. Expected an object, but got ${typeof data}`);
        }
        const validator = createModelValidator(createOrUpdate)({
            model,
            data,
            entity,
            componentContext: {
                // Set up the initial component context.
                // Keeping track of parent content type context in which a component will be used.
                // This is necessary to validate component field constraints such as uniqueness.
                parentContent: {
                    id: entity?.id,
                    model,
                    options
                },
                pathToComponent: [],
                repeatableData: []
            }
        }, {
            isDraft: options?.isDraft ?? false,
            locale: options?.locale ?? null
        }).test('relations-test', 'check that all relations exist', async function relationsValidation(data) {
            try {
                await checkRelationsExist(buildRelationsStore({
                    uid: model.uid,
                    data
                }));
            } catch (e) {
                return this.createError({
                    path: this.path,
                    message: e instanceof ValidationError && e.message || 'Invalid relations'
                });
            }
            return true;
        }).required();
        return validateYupSchema(validator, {
            strict: false,
            abortEarly: false
        })(data);
    };
};
/**
 * Builds an object containing all the media and relations being associated with an entity
 */ const buildRelationsStore = ({ uid, data })=>{
    if (!uid) {
        throw new ValidationError(`Cannot build relations store: "uid" is undefined`);
    }
    if (fp.isEmpty(data)) {
        return {};
    }
    const currentModel = strapi.getModel(uid);
    return Object.keys(currentModel.attributes).reduce((result, attributeName)=>{
        const attribute = currentModel.attributes[attributeName];
        const value = data[attributeName];
        if (_.isNil(value)) {
            return result;
        }
        switch(attribute.type){
            case 'relation':
            case 'media':
                {
                    if (attribute.type === 'relation' && (attribute.relation === 'morphToMany' || attribute.relation === 'morphToOne')) {
                        break;
                    }
                    const target = // eslint-disable-next-line no-nested-ternary
                    attribute.type === 'media' ? 'plugin::upload.file' : attribute.target;
                    // As there are multiple formats supported for associating relations
                    // with an entity, the value here can be an: array, object or number.
                    let source;
                    if (Array.isArray(value)) {
                        source = value;
                    } else if (fp.isObject(value)) {
                        if ('connect' in value && !_.isNil(value.connect)) {
                            source = value.connect;
                        } else if ('set' in value && !_.isNil(value.set)) {
                            source = value.set;
                        } else {
                            source = [];
                        }
                    } else {
                        source = _.castArray(value);
                    }
                    const idArray = source.map((v)=>({
                            id: typeof v === 'object' ? v.id : v
                        }));
                    // Update the relationStore to keep track of all associations being made
                    // with relations and media.
                    result[target] = result[target] || [];
                    result[target].push(...idArray);
                    break;
                }
            case 'component':
                {
                    return _.castArray(value).reduce((relationsStore, componentValue)=>{
                        if (!attribute.component) {
                            throw new ValidationError(`Cannot build relations store from component, component identifier is undefined`);
                        }
                        return _.mergeWith(relationsStore, buildRelationsStore({
                            uid: attribute.component,
                            data: componentValue
                        }), (objValue, srcValue)=>{
                            if (_.isArray(objValue)) {
                                return objValue.concat(srcValue);
                            }
                        });
                    }, result);
                }
            case 'dynamiczone':
                {
                    return _.castArray(value).reduce((relationsStore, dzValue)=>{
                        const value = dzValue;
                        if (!value.__component) {
                            throw new ValidationError(`Cannot build relations store from dynamiczone, component identifier is undefined`);
                        }
                        return _.mergeWith(relationsStore, buildRelationsStore({
                            uid: value.__component,
                            data: value
                        }), (objValue, srcValue)=>{
                            if (_.isArray(objValue)) {
                                return objValue.concat(srcValue);
                            }
                        });
                    }, result);
                }
        }
        return result;
    }, {});
};
/**
 * Iterate through the relations store and validates that every relation or media
 * mentioned exists
 */ const checkRelationsExist = async (relationsStore = {})=>{
    const promises = [];
    for (const [key, value] of Object.entries(relationsStore)){
        const evaluate = async ()=>{
            const uniqueValues = _.uniqBy(value, `id`);
            const count = await strapi.db.query(key).count({
                where: {
                    id: {
                        $in: uniqueValues.map((v)=>v.id)
                    }
                }
            });
            if (count !== uniqueValues.length) {
                throw new ValidationError(`${uniqueValues.length - count} relation(s) of type ${key} associated with this entity do not exist`);
            }
        };
        promises.push(evaluate());
    }
    return Promise.all(promises);
};
const entityValidator = {
    validateEntityCreation: createValidateEntity('creation'),
    validateEntityUpdate: createValidateEntity('update')
};

module.exports = entityValidator;
//# sourceMappingURL=index.js.map
