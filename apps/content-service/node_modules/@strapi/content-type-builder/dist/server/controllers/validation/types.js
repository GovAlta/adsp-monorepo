'use strict';

var _ = require('lodash');
var utils = require('@strapi/utils');
var constants = require('../../services/constants.js');
var common = require('./common.js');

const maxLengthIsGreaterThanOrEqualToMinLength = {
    name: 'isGreaterThanMin',
    message: 'maxLength must be greater or equal to minLength',
    test (value) {
        const { minLength } = this.parent;
        return !(!_.isUndefined(minLength) && !_.isUndefined(value) && value < minLength);
    }
};
const getTypeValidator = (attribute, { types, modelType, attributes })=>{
    return utils.yup.object({
        type: utils.yup.string().oneOf([
            ...types
        ]).required(),
        configurable: utils.yup.boolean().nullable(),
        private: utils.yup.boolean().nullable(),
        pluginOptions: utils.yup.object(),
        ...getTypeShape(attribute, {
            modelType,
            attributes
        })
    });
};
const getTypeShape = (attribute, { attributes } = {})=>{
    switch(attribute.type){
        /**
     * complex types
     */ case 'media':
            {
                return {
                    multiple: utils.yup.boolean(),
                    required: common.validators.required,
                    allowedTypes: utils.yup.array().of(utils.yup.string().oneOf([
                        'images',
                        'videos',
                        'files',
                        'audios'
                    ])).min(1)
                };
            }
        case 'uid':
            {
                return {
                    required: common.validators.required,
                    targetField: utils.yup.string().oneOf(Object.keys(attributes).filter((key)=>constants.VALID_UID_TARGETS.includes(_.get(attributes[key], 'type')))).nullable(),
                    default: utils.yup.string().test('isValidDefaultUID', 'cannot define a default UID if the targetField is set', function(value) {
                        const { targetField } = this.parent;
                        return !!(_.isNil(targetField) || _.isNil(value));
                    }).test('isValidDefaultRegexUID', `\${path} must match the custom regex or the default one "${common.UID_REGEX}"`, function(value) {
                        const { regex } = this.parent;
                        if (regex) {
                            return !_.isNil(value) && (value === '' || new RegExp(regex).test(value));
                        }
                        return value === '' || common.UID_REGEX.test(value);
                    }),
                    minLength: common.validators.minLength,
                    maxLength: common.validators.maxLength.max(256).test(maxLengthIsGreaterThanOrEqualToMinLength),
                    options: utils.yup.object().shape({
                        separator: utils.yup.string(),
                        lowercase: utils.yup.boolean(),
                        decamelize: utils.yup.boolean(),
                        customReplacements: utils.yup.array().of(utils.yup.array().of(utils.yup.string()).min(2).max(2)),
                        preserveLeadingUnderscore: utils.yup.boolean()
                    }),
                    regex: utils.yup.string().test(common.isValidRegExpPattern)
                };
            }
        /**
     * scalar types
     */ case 'string':
        case 'text':
            {
                return {
                    default: utils.yup.string(),
                    required: common.validators.required,
                    unique: common.validators.unique,
                    minLength: common.validators.minLength,
                    maxLength: common.validators.maxLength,
                    regex: utils.yup.string().test(common.isValidRegExpPattern)
                };
            }
        case 'richtext':
            {
                return {
                    default: utils.yup.string(),
                    required: common.validators.required,
                    minLength: common.validators.minLength,
                    maxLength: common.validators.maxLength
                };
            }
        case 'blocks':
            {
                return {
                    required: common.validators.required
                };
            }
        case 'json':
            {
                return {
                    default: utils.yup.mixed().test(common.isValidDefaultJSON),
                    required: common.validators.required
                };
            }
        case 'enumeration':
            {
                return {
                    enum: utils.yup.array().of(utils.yup.string().test(common.isValidEnum).required()).min(1).test(common.areEnumValuesUnique).required(),
                    default: utils.yup.string().when('enum', (enumVal)=>utils.yup.string().oneOf(enumVal)),
                    enumName: utils.yup.string().test(common.isValidName),
                    required: common.validators.required
                };
            }
        case 'password':
            {
                return {
                    required: common.validators.required,
                    minLength: common.validators.minLength,
                    maxLength: common.validators.maxLength
                };
            }
        case 'email':
            {
                return {
                    default: utils.yup.string().email(),
                    required: common.validators.required,
                    unique: common.validators.unique,
                    minLength: common.validators.minLength,
                    maxLength: common.validators.maxLength
                };
            }
        case 'integer':
            {
                return {
                    default: utils.yup.number().integer(),
                    required: common.validators.required,
                    unique: common.validators.unique,
                    min: utils.yup.number().integer(),
                    max: utils.yup.number().integer()
                };
            }
        case 'biginteger':
            {
                return {
                    default: utils.yup.string().nullable().matches(/^\d*$/),
                    required: common.validators.required,
                    unique: common.validators.unique,
                    min: utils.yup.string().nullable().matches(/^\d*$/),
                    max: utils.yup.string().nullable().matches(/^\d*$/)
                };
            }
        case 'float':
            {
                return {
                    default: utils.yup.number(),
                    required: common.validators.required,
                    unique: common.validators.unique,
                    min: utils.yup.number(),
                    max: utils.yup.number()
                };
            }
        case 'decimal':
            {
                return {
                    default: utils.yup.number(),
                    required: common.validators.required,
                    unique: common.validators.unique,
                    min: utils.yup.number(),
                    max: utils.yup.number()
                };
            }
        case 'time':
        case 'datetime':
        case 'date':
            {
                return {
                    default: utils.yup.string(),
                    required: common.validators.required,
                    unique: common.validators.unique
                };
            }
        case 'boolean':
            {
                return {
                    default: utils.yup.boolean(),
                    required: common.validators.required
                };
            }
        case 'component':
            {
                return {
                    required: common.validators.required,
                    repeatable: utils.yup.boolean(),
                    // TODO: Add correct server validation for nested components
                    component: utils.yup.string().required(),
                    min: utils.yup.number(),
                    max: utils.yup.number()
                };
            }
        case 'dynamiczone':
            {
                return {
                    required: common.validators.required,
                    components: utils.yup.array().of(utils.yup.string().required()).test('isArray', '${path} must be an array', (value)=>Array.isArray(value)).min(1),
                    min: utils.yup.number(),
                    max: utils.yup.number()
                };
            }
        default:
            {
                return {};
            }
    }
};

exports.getTypeValidator = getTypeValidator;
//# sourceMappingURL=types.js.map
