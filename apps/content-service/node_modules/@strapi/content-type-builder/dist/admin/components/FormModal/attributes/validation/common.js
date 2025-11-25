'use strict';

var strapiAdmin = require('@strapi/admin/strapi-admin');
var fp = require('lodash/fp');
var toNumber = require('lodash/toNumber');
var yup = require('yup');
var getTrad = require('../../../../utils/getTrad.js');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var yup__namespace = /*#__PURE__*/_interopNamespaceDefault(yup);

const NAME_REGEX = /^[A-Za-z][_0-9A-Za-z]*$/;
const alreadyUsedAttributeNames = (usedNames)=>{
    return {
        name: 'attributeNameAlreadyUsed',
        message: strapiAdmin.translatedErrors.unique.id,
        test (value) {
            if (!value) {
                return false;
            }
            const snakeCaseKey = fp.snakeCase(value);
            return !usedNames.some((existingKey)=>{
                return fp.snakeCase(existingKey) === snakeCaseKey;
            });
        }
    };
};
const isNameAllowed = (reservedNames)=>{
    return {
        name: 'forbiddenAttributeName',
        message: getTrad.getTrad('error.attributeName.reserved-name'),
        test (value) {
            if (!value) {
                return false;
            }
            const snakeCaseKey = fp.snakeCase(value);
            return !reservedNames.some((existingKey)=>{
                return fp.snakeCase(existingKey) === snakeCaseKey;
            });
        }
    };
};
const validators = {
    default: ()=>yup__namespace.string().nullable(),
    max: ()=>yup__namespace.number().integer().nullable(),
    min: ()=>yup__namespace.number().integer().when('max', (max, schema)=>{
            if (max) {
                return schema.max(max, getTrad.getTrad('error.validation.minSupMax'));
            }
            return schema;
        }).nullable(),
    maxLength: ()=>yup__namespace.number().integer().positive(getTrad.getTrad('error.validation.positive')).nullable(),
    minLength: ()=>yup__namespace.number().integer().min(1).when('maxLength', (maxLength, schema)=>{
            if (maxLength) {
                return schema.max(maxLength, getTrad.getTrad('error.validation.minSupMax'));
            }
            return schema;
        }).nullable(),
    name (usedNames, reservedNames) {
        return yup__namespace.string().test(alreadyUsedAttributeNames(usedNames)).test(isNameAllowed(reservedNames)).matches(NAME_REGEX, strapiAdmin.translatedErrors.regex.id).required(strapiAdmin.translatedErrors.required.id);
    },
    required: ()=>yup__namespace.boolean(),
    type: ()=>yup__namespace.string().required(strapiAdmin.translatedErrors.required.id),
    unique: ()=>yup__namespace.boolean().nullable()
};
const createTextShape = (usedAttributeNames, reservedNames)=>{
    const shape = {
        name: validators.name(usedAttributeNames, reservedNames),
        type: validators.type(),
        default: validators.default(),
        unique: validators.unique(),
        required: validators.required(),
        maxLength: validators.maxLength(),
        minLength: validators.minLength(),
        regex: yup__namespace.string().test({
            name: 'isValidRegExpPattern',
            message: getTrad.getTrad('error.validation.regex'),
            test (value) {
                try {
                    return new RegExp(value || '') !== null;
                } catch (e) {
                    return false;
                }
            }
        }).nullable()
    };
    return shape;
};
const isMinSuperiorThanMax = ()=>({
        name: 'isMinSuperiorThanMax',
        message: getTrad.getTrad('error.validation.minSupMax'),
        test (min) {
            if (!min) {
                return true;
            }
            const { max } = this.parent;
            if (!max) {
                return true;
            }
            if (Number.isNaN(toNumber(min))) {
                return true;
            }
            return toNumber(max) >= toNumber(min);
        }
    });

exports.NAME_REGEX = NAME_REGEX;
exports.alreadyUsedAttributeNames = alreadyUsedAttributeNames;
exports.createTextShape = createTextShape;
exports.isMinSuperiorThanMax = isMinSuperiorThanMax;
exports.isNameAllowed = isNameAllowed;
exports.validators = validators;
//# sourceMappingURL=common.js.map
