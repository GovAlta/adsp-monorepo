'use strict';

var strapiAdmin = require('@strapi/admin/strapi-admin');
var uniq = require('lodash/uniq');
var yup = require('yup');
var getRelationType = require('../../../utils/getRelationType.js');
var getTrad = require('../../../utils/getTrad.js');
var toRegressedEnumValue = require('../../../utils/toRegressedEnumValue.js');
var common = require('./validation/common.js');

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

const attributeTypes = {
    date (usedAttributeNames, reservedNames) {
        const shape = {
            name: common.validators.name(usedAttributeNames, reservedNames),
            type: common.validators.type()
        };
        return yup__namespace.object(shape);
    },
    datetime (usedAttributeNames, reservedNames) {
        const shape = {
            name: common.validators.name(usedAttributeNames, reservedNames),
            type: common.validators.type()
        };
        return yup__namespace.object(shape);
    },
    time (usedAttributeNames, reservedNames) {
        const shape = {
            name: common.validators.name(usedAttributeNames, reservedNames),
            type: common.validators.type()
        };
        return yup__namespace.object(shape);
    },
    default (usedAttributeNames, reservedNames) {
        const shape = {
            name: common.validators.name(usedAttributeNames, reservedNames),
            type: common.validators.type()
        };
        return yup__namespace.object(shape);
    },
    biginteger (usedAttributeNames, reservedNames) {
        const shape = {
            name: common.validators.name(usedAttributeNames, reservedNames),
            type: common.validators.type(),
            default: yup__namespace.string().nullable().matches(/^-?\d*$/),
            unique: common.validators.unique(),
            required: common.validators.required(),
            max: yup__namespace.string().nullable().matches(/^-?\d*$/, strapiAdmin.translatedErrors.regex.id),
            min: yup__namespace.string().nullable().test(common.isMinSuperiorThanMax()).matches(/^-?\d*$/, strapiAdmin.translatedErrors.regex.id)
        };
        return yup__namespace.object(shape);
    },
    boolean (usedAttributeNames, reservedNames) {
        const shape = {
            name: common.validators.name(usedAttributeNames, reservedNames),
            default: yup__namespace.boolean().nullable(),
            required: common.validators.required(),
            unique: common.validators.unique()
        };
        return yup__namespace.object(shape);
    },
    component (usedAttributeNames, reservedNames) {
        const shape = {
            name: common.validators.name(usedAttributeNames, reservedNames),
            type: common.validators.type(),
            required: common.validators.required(),
            max: common.validators.max(),
            min: common.validators.min(),
            component: yup__namespace.string().required(strapiAdmin.translatedErrors.required.id)
        };
        return yup__namespace.object(shape);
    },
    decimal (usedAttributeNames, reservedNames) {
        const shape = {
            name: common.validators.name(usedAttributeNames, reservedNames),
            type: common.validators.type(),
            default: yup__namespace.number(),
            required: common.validators.required(),
            max: yup__namespace.number(),
            min: yup__namespace.number().test(common.isMinSuperiorThanMax())
        };
        return yup__namespace.object(shape);
    },
    dynamiczone (usedAttributeNames, reservedNames) {
        const shape = {
            name: common.validators.name(usedAttributeNames, reservedNames),
            type: common.validators.type(),
            required: common.validators.required(),
            max: common.validators.max(),
            min: common.validators.min()
        };
        return yup__namespace.object(shape);
    },
    email (usedAttributeNames, reservedNames) {
        const shape = {
            name: common.validators.name(usedAttributeNames, reservedNames),
            type: common.validators.type(),
            default: yup__namespace.string().email().nullable(),
            unique: common.validators.unique(),
            required: common.validators.required(),
            maxLength: common.validators.maxLength(),
            minLength: common.validators.minLength()
        };
        return yup__namespace.object(shape);
    },
    enumeration (usedAttributeNames, reservedNames) {
        /**
     * For enumerations the least common denomiator is GraphQL, where
     * values needs to match the secure name regex:
     * GraphQL Spec https://spec.graphql.org/June2018/#sec-Names
     *
     * Therefore we need to make sure our users only use values, which
     * can be returned by GraphQL, by checking the regressed values
     * agains the GraphQL regex.
     *
     * TODO V5: check if we can avoid this coupling by moving this logic
     * into the GraphQL plugin.
     */ const GRAPHQL_ENUM_REGEX = /^[_A-Za-z][_0-9A-Za-z]*$/;
        const shape = {
            name: yup__namespace.string().test(common.alreadyUsedAttributeNames(usedAttributeNames)).test(common.isNameAllowed(reservedNames)).matches(GRAPHQL_ENUM_REGEX, strapiAdmin.translatedErrors.regex.id).required(strapiAdmin.translatedErrors.required.id),
            type: common.validators.type(),
            default: common.validators.default(),
            unique: common.validators.unique(),
            required: common.validators.required(),
            enum: yup__namespace.array().of(yup__namespace.string()).min(1, strapiAdmin.translatedErrors.min.id).test({
                name: 'areEnumValuesUnique',
                message: getTrad.getTrad('error.validation.enum-duplicate'),
                test (values) {
                    if (!values) {
                        return false;
                    }
                    const duplicates = uniq(values.map(toRegressedEnumValue.toRegressedEnumValue).filter((value, index, values)=>values.indexOf(value) !== index));
                    return !duplicates.length;
                }
            }).test({
                name: 'doesNotHaveEmptyValues',
                message: getTrad.getTrad('error.validation.enum-empty-string'),
                test: (values)=>{
                    if (!values) {
                        return false;
                    }
                    return !values.map(toRegressedEnumValue.toRegressedEnumValue).some((val)=>val === '');
                }
            }).test({
                name: 'doesMatchRegex',
                message: getTrad.getTrad('error.validation.enum-regex'),
                test: (values)=>{
                    if (!values) {
                        return false;
                    }
                    return values.map(toRegressedEnumValue.toRegressedEnumValue).every((value)=>GRAPHQL_ENUM_REGEX.test(value));
                }
            }),
            enumName: yup__namespace.string().nullable()
        };
        return yup__namespace.object(shape);
    },
    float (usedAttributeNames, reservedNames) {
        const shape = {
            name: common.validators.name(usedAttributeNames, reservedNames),
            type: common.validators.type(),
            required: common.validators.required(),
            default: yup__namespace.number(),
            max: yup__namespace.number(),
            min: yup__namespace.number().test(common.isMinSuperiorThanMax())
        };
        return yup__namespace.object(shape);
    },
    integer (usedAttributeNames, reservedNames) {
        const shape = {
            name: common.validators.name(usedAttributeNames, reservedNames),
            type: common.validators.type(),
            default: yup__namespace.number().integer(),
            unique: common.validators.unique(),
            required: common.validators.required(),
            max: common.validators.max(),
            min: common.validators.min()
        };
        return yup__namespace.object(shape);
    },
    json (usedAttributeNames, reservedNames) {
        const shape = {
            name: common.validators.name(usedAttributeNames, reservedNames),
            type: common.validators.type(),
            required: common.validators.required(),
            unique: common.validators.unique()
        };
        return yup__namespace.object(shape);
    },
    media (usedAttributeNames, reservedNames) {
        const shape = {
            name: common.validators.name(usedAttributeNames, reservedNames),
            type: common.validators.type(),
            multiple: yup__namespace.boolean(),
            required: common.validators.required(),
            allowedTypes: yup__namespace.array().of(yup__namespace.string().oneOf([
                'images',
                'videos',
                'files',
                'audios'
            ])).min(1).nullable()
        };
        return yup__namespace.object(shape);
    },
    password (usedAttributeNames, reservedNames) {
        const shape = {
            name: common.validators.name(usedAttributeNames, reservedNames),
            type: common.validators.type(),
            default: common.validators.default(),
            unique: common.validators.unique(),
            required: common.validators.required(),
            maxLength: common.validators.maxLength(),
            minLength: common.validators.minLength()
        };
        return yup__namespace.object(shape);
    },
    relation (usedAttributeNames, reservedNames, alreadyTakenTargetAttributes, { initialData, modifiedData }) {
        const shape = {
            name: common.validators.name(usedAttributeNames, reservedNames),
            target: yup__namespace.string().required(strapiAdmin.translatedErrors.required.id),
            relation: yup__namespace.string().required(),
            type: yup__namespace.string().required(),
            targetAttribute: yup__namespace.lazy(()=>{
                const relationType = getRelationType.getRelationType(modifiedData.relation, modifiedData.targetAttribute);
                if (relationType === 'oneWay' || relationType === 'manyWay') {
                    return yup__namespace.string().nullable();
                }
                const schema = yup__namespace.string().test(common.isNameAllowed(reservedNames));
                const initialForbiddenName = [
                    ...alreadyTakenTargetAttributes.map(({ name })=>name),
                    modifiedData.name
                ];
                const forbiddenTargetAttributeName = initialForbiddenName.filter((val)=>val !== initialData.targetAttribute);
                return schema.matches(common.NAME_REGEX, strapiAdmin.translatedErrors.regex.id).test({
                    name: 'forbiddenTargetAttributeName',
                    message: getTrad.getTrad('error.validation.relation.targetAttribute-taken'),
                    test (value) {
                        if (!value) {
                            return false;
                        }
                        return !forbiddenTargetAttributeName.includes(value);
                    }
                }).required(strapiAdmin.translatedErrors.required.id);
            })
        };
        return yup__namespace.object(shape);
    },
    richtext (usedAttributeNames, reservedNames) {
        const shape = {
            name: common.validators.name(usedAttributeNames, reservedNames),
            type: common.validators.type(),
            default: common.validators.default(),
            unique: common.validators.unique(),
            required: common.validators.required(),
            maxLength: common.validators.maxLength(),
            minLength: common.validators.minLength()
        };
        return yup__namespace.object(shape);
    },
    blocks (usedAttributeNames, reservedNames) {
        const shape = {
            name: common.validators.name(usedAttributeNames, reservedNames),
            type: common.validators.type(),
            default: common.validators.default(),
            unique: common.validators.unique(),
            required: common.validators.required(),
            maxLength: common.validators.maxLength(),
            minLength: common.validators.minLength()
        };
        return yup__namespace.object(shape);
    },
    string (usedAttributeNames, reservedNames) {
        const shape = common.createTextShape(usedAttributeNames, reservedNames);
        return yup__namespace.object(shape);
    },
    text (usedAttributeNames, reservedNames) {
        const shape = common.createTextShape(usedAttributeNames, reservedNames);
        return yup__namespace.object(shape);
    },
    uid (usedAttributeNames, reservedNames) {
        const shape = common.createTextShape(usedAttributeNames, reservedNames);
        return yup__namespace.object(shape);
    }
};

exports.attributeTypes = attributeTypes;
//# sourceMappingURL=types.js.map
