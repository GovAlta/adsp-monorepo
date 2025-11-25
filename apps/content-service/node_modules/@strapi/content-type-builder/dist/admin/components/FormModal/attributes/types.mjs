import { translatedErrors } from '@strapi/admin/strapi-admin';
import uniq from 'lodash/uniq';
import * as yup from 'yup';
import { getRelationType } from '../../../utils/getRelationType.mjs';
import { getTrad } from '../../../utils/getTrad.mjs';
import { toRegressedEnumValue } from '../../../utils/toRegressedEnumValue.mjs';
import { validators, isMinSuperiorThanMax, alreadyUsedAttributeNames, isNameAllowed, NAME_REGEX, createTextShape } from './validation/common.mjs';

const attributeTypes = {
    date (usedAttributeNames, reservedNames) {
        const shape = {
            name: validators.name(usedAttributeNames, reservedNames),
            type: validators.type()
        };
        return yup.object(shape);
    },
    datetime (usedAttributeNames, reservedNames) {
        const shape = {
            name: validators.name(usedAttributeNames, reservedNames),
            type: validators.type()
        };
        return yup.object(shape);
    },
    time (usedAttributeNames, reservedNames) {
        const shape = {
            name: validators.name(usedAttributeNames, reservedNames),
            type: validators.type()
        };
        return yup.object(shape);
    },
    default (usedAttributeNames, reservedNames) {
        const shape = {
            name: validators.name(usedAttributeNames, reservedNames),
            type: validators.type()
        };
        return yup.object(shape);
    },
    biginteger (usedAttributeNames, reservedNames) {
        const shape = {
            name: validators.name(usedAttributeNames, reservedNames),
            type: validators.type(),
            default: yup.string().nullable().matches(/^-?\d*$/),
            unique: validators.unique(),
            required: validators.required(),
            max: yup.string().nullable().matches(/^-?\d*$/, translatedErrors.regex.id),
            min: yup.string().nullable().test(isMinSuperiorThanMax()).matches(/^-?\d*$/, translatedErrors.regex.id)
        };
        return yup.object(shape);
    },
    boolean (usedAttributeNames, reservedNames) {
        const shape = {
            name: validators.name(usedAttributeNames, reservedNames),
            default: yup.boolean().nullable(),
            required: validators.required(),
            unique: validators.unique()
        };
        return yup.object(shape);
    },
    component (usedAttributeNames, reservedNames) {
        const shape = {
            name: validators.name(usedAttributeNames, reservedNames),
            type: validators.type(),
            required: validators.required(),
            max: validators.max(),
            min: validators.min(),
            component: yup.string().required(translatedErrors.required.id)
        };
        return yup.object(shape);
    },
    decimal (usedAttributeNames, reservedNames) {
        const shape = {
            name: validators.name(usedAttributeNames, reservedNames),
            type: validators.type(),
            default: yup.number(),
            required: validators.required(),
            max: yup.number(),
            min: yup.number().test(isMinSuperiorThanMax())
        };
        return yup.object(shape);
    },
    dynamiczone (usedAttributeNames, reservedNames) {
        const shape = {
            name: validators.name(usedAttributeNames, reservedNames),
            type: validators.type(),
            required: validators.required(),
            max: validators.max(),
            min: validators.min()
        };
        return yup.object(shape);
    },
    email (usedAttributeNames, reservedNames) {
        const shape = {
            name: validators.name(usedAttributeNames, reservedNames),
            type: validators.type(),
            default: yup.string().email().nullable(),
            unique: validators.unique(),
            required: validators.required(),
            maxLength: validators.maxLength(),
            minLength: validators.minLength()
        };
        return yup.object(shape);
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
            name: yup.string().test(alreadyUsedAttributeNames(usedAttributeNames)).test(isNameAllowed(reservedNames)).matches(GRAPHQL_ENUM_REGEX, translatedErrors.regex.id).required(translatedErrors.required.id),
            type: validators.type(),
            default: validators.default(),
            unique: validators.unique(),
            required: validators.required(),
            enum: yup.array().of(yup.string()).min(1, translatedErrors.min.id).test({
                name: 'areEnumValuesUnique',
                message: getTrad('error.validation.enum-duplicate'),
                test (values) {
                    if (!values) {
                        return false;
                    }
                    const duplicates = uniq(values.map(toRegressedEnumValue).filter((value, index, values)=>values.indexOf(value) !== index));
                    return !duplicates.length;
                }
            }).test({
                name: 'doesNotHaveEmptyValues',
                message: getTrad('error.validation.enum-empty-string'),
                test: (values)=>{
                    if (!values) {
                        return false;
                    }
                    return !values.map(toRegressedEnumValue).some((val)=>val === '');
                }
            }).test({
                name: 'doesMatchRegex',
                message: getTrad('error.validation.enum-regex'),
                test: (values)=>{
                    if (!values) {
                        return false;
                    }
                    return values.map(toRegressedEnumValue).every((value)=>GRAPHQL_ENUM_REGEX.test(value));
                }
            }),
            enumName: yup.string().nullable()
        };
        return yup.object(shape);
    },
    float (usedAttributeNames, reservedNames) {
        const shape = {
            name: validators.name(usedAttributeNames, reservedNames),
            type: validators.type(),
            required: validators.required(),
            default: yup.number(),
            max: yup.number(),
            min: yup.number().test(isMinSuperiorThanMax())
        };
        return yup.object(shape);
    },
    integer (usedAttributeNames, reservedNames) {
        const shape = {
            name: validators.name(usedAttributeNames, reservedNames),
            type: validators.type(),
            default: yup.number().integer(),
            unique: validators.unique(),
            required: validators.required(),
            max: validators.max(),
            min: validators.min()
        };
        return yup.object(shape);
    },
    json (usedAttributeNames, reservedNames) {
        const shape = {
            name: validators.name(usedAttributeNames, reservedNames),
            type: validators.type(),
            required: validators.required(),
            unique: validators.unique()
        };
        return yup.object(shape);
    },
    media (usedAttributeNames, reservedNames) {
        const shape = {
            name: validators.name(usedAttributeNames, reservedNames),
            type: validators.type(),
            multiple: yup.boolean(),
            required: validators.required(),
            allowedTypes: yup.array().of(yup.string().oneOf([
                'images',
                'videos',
                'files',
                'audios'
            ])).min(1).nullable()
        };
        return yup.object(shape);
    },
    password (usedAttributeNames, reservedNames) {
        const shape = {
            name: validators.name(usedAttributeNames, reservedNames),
            type: validators.type(),
            default: validators.default(),
            unique: validators.unique(),
            required: validators.required(),
            maxLength: validators.maxLength(),
            minLength: validators.minLength()
        };
        return yup.object(shape);
    },
    relation (usedAttributeNames, reservedNames, alreadyTakenTargetAttributes, { initialData, modifiedData }) {
        const shape = {
            name: validators.name(usedAttributeNames, reservedNames),
            target: yup.string().required(translatedErrors.required.id),
            relation: yup.string().required(),
            type: yup.string().required(),
            targetAttribute: yup.lazy(()=>{
                const relationType = getRelationType(modifiedData.relation, modifiedData.targetAttribute);
                if (relationType === 'oneWay' || relationType === 'manyWay') {
                    return yup.string().nullable();
                }
                const schema = yup.string().test(isNameAllowed(reservedNames));
                const initialForbiddenName = [
                    ...alreadyTakenTargetAttributes.map(({ name })=>name),
                    modifiedData.name
                ];
                const forbiddenTargetAttributeName = initialForbiddenName.filter((val)=>val !== initialData.targetAttribute);
                return schema.matches(NAME_REGEX, translatedErrors.regex.id).test({
                    name: 'forbiddenTargetAttributeName',
                    message: getTrad('error.validation.relation.targetAttribute-taken'),
                    test (value) {
                        if (!value) {
                            return false;
                        }
                        return !forbiddenTargetAttributeName.includes(value);
                    }
                }).required(translatedErrors.required.id);
            })
        };
        return yup.object(shape);
    },
    richtext (usedAttributeNames, reservedNames) {
        const shape = {
            name: validators.name(usedAttributeNames, reservedNames),
            type: validators.type(),
            default: validators.default(),
            unique: validators.unique(),
            required: validators.required(),
            maxLength: validators.maxLength(),
            minLength: validators.minLength()
        };
        return yup.object(shape);
    },
    blocks (usedAttributeNames, reservedNames) {
        const shape = {
            name: validators.name(usedAttributeNames, reservedNames),
            type: validators.type(),
            default: validators.default(),
            unique: validators.unique(),
            required: validators.required(),
            maxLength: validators.maxLength(),
            minLength: validators.minLength()
        };
        return yup.object(shape);
    },
    string (usedAttributeNames, reservedNames) {
        const shape = createTextShape(usedAttributeNames, reservedNames);
        return yup.object(shape);
    },
    text (usedAttributeNames, reservedNames) {
        const shape = createTextShape(usedAttributeNames, reservedNames);
        return yup.object(shape);
    },
    uid (usedAttributeNames, reservedNames) {
        const shape = createTextShape(usedAttributeNames, reservedNames);
        return yup.object(shape);
    }
};

export { attributeTypes };
//# sourceMappingURL=types.mjs.map
