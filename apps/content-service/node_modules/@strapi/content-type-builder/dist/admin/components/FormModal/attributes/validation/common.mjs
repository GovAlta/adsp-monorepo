import { translatedErrors } from '@strapi/admin/strapi-admin';
import { snakeCase } from 'lodash/fp';
import toNumber from 'lodash/toNumber';
import * as yup from 'yup';
import { getTrad } from '../../../../utils/getTrad.mjs';

const NAME_REGEX = /^[A-Za-z][_0-9A-Za-z]*$/;
const alreadyUsedAttributeNames = (usedNames)=>{
    return {
        name: 'attributeNameAlreadyUsed',
        message: translatedErrors.unique.id,
        test (value) {
            if (!value) {
                return false;
            }
            const snakeCaseKey = snakeCase(value);
            return !usedNames.some((existingKey)=>{
                return snakeCase(existingKey) === snakeCaseKey;
            });
        }
    };
};
const isNameAllowed = (reservedNames)=>{
    return {
        name: 'forbiddenAttributeName',
        message: getTrad('error.attributeName.reserved-name'),
        test (value) {
            if (!value) {
                return false;
            }
            const snakeCaseKey = snakeCase(value);
            return !reservedNames.some((existingKey)=>{
                return snakeCase(existingKey) === snakeCaseKey;
            });
        }
    };
};
const validators = {
    default: ()=>yup.string().nullable(),
    max: ()=>yup.number().integer().nullable(),
    min: ()=>yup.number().integer().when('max', (max, schema)=>{
            if (max) {
                return schema.max(max, getTrad('error.validation.minSupMax'));
            }
            return schema;
        }).nullable(),
    maxLength: ()=>yup.number().integer().positive(getTrad('error.validation.positive')).nullable(),
    minLength: ()=>yup.number().integer().min(1).when('maxLength', (maxLength, schema)=>{
            if (maxLength) {
                return schema.max(maxLength, getTrad('error.validation.minSupMax'));
            }
            return schema;
        }).nullable(),
    name (usedNames, reservedNames) {
        return yup.string().test(alreadyUsedAttributeNames(usedNames)).test(isNameAllowed(reservedNames)).matches(NAME_REGEX, translatedErrors.regex.id).required(translatedErrors.required.id);
    },
    required: ()=>yup.boolean(),
    type: ()=>yup.string().required(translatedErrors.required.id),
    unique: ()=>yup.boolean().nullable()
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
        regex: yup.string().test({
            name: 'isValidRegExpPattern',
            message: getTrad('error.validation.regex'),
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
        message: getTrad('error.validation.minSupMax'),
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

export { NAME_REGEX, alreadyUsedAttributeNames, createTextShape, isMinSuperiorThanMax, isNameAllowed, validators };
//# sourceMappingURL=common.mjs.map
