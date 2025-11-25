'use strict';

var utils = require('@strapi/utils');
var _ = require('lodash');

const validators = {
    required: utils.yup.boolean(),
    unique: utils.yup.boolean(),
    minLength: utils.yup.number().integer().positive(),
    maxLength: utils.yup.number().integer().positive()
};
const NAME_REGEX = /^[A-Za-z][_0-9A-Za-z]*$/;
const COLLECTION_NAME_REGEX = /^[A-Za-z][-_0-9A-Za-z]*$/;
const CATEGORY_NAME_REGEX = /^[A-Za-z][-_0-9A-Za-z]*$/;
const ICON_REGEX = /^[A-Za-z0-9][-A-Za-z0-9]*$/;
const UID_REGEX = /^[A-Za-z0-9-_.~]*$/;
const KEBAB_BASE_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isValidName = {
    name: 'isValidName',
    message: `\${path} must match the following regex: ${NAME_REGEX}`,
    test: (val)=>val === '' || NAME_REGEX.test(val)
};
const isValidIcon = {
    name: 'isValidIcon',
    message: `\${path} is not a valid icon name. Make sure your icon name starts with an alphanumeric character and only includes alphanumeric characters or dashes.`,
    test: (val)=>val === '' || ICON_REGEX.test(val)
};
const isValidCategoryName = {
    name: 'isValidCategoryName',
    message: `\${path} must match the following regex: ${CATEGORY_NAME_REGEX}`,
    test: (val)=>val === '' || CATEGORY_NAME_REGEX.test(val)
};
const isValidCollectionName = {
    name: 'isValidCollectionName',
    message: `\${path} must match the following regex: ${COLLECTION_NAME_REGEX}`,
    test: (val)=>val === '' || COLLECTION_NAME_REGEX.test(val)
};
const isValidKey = (key)=>({
        name: 'isValidKey',
        message: `Attribute name '${key}' must match the following regex: ${NAME_REGEX}`,
        test: ()=>NAME_REGEX.test(key)
    });
const isValidEnum = {
    name: 'isValidEnum',
    message: '${path} should not start with number',
    test: (val)=>val === '' || !utils.strings.startsWithANumber(val)
};
const areEnumValuesUnique = {
    name: 'areEnumValuesUnique',
    message: '${path} cannot contain duplicate values',
    test (values) {
        const filtered = [
            ...new Set(values)
        ];
        return filtered.length === values.length;
    }
};
const isValidRegExpPattern = {
    name: 'isValidRegExpPattern',
    message: '${path} must be a valid RexExp pattern string',
    test: (val)=>val === '' || !!new RegExp(val)
};
const isValidDefaultJSON = {
    name: 'isValidDefaultJSON',
    message: '${path} is not a valid JSON',
    test (val) {
        if (val === undefined) {
            return true;
        }
        if (_.isNumber(val) || _.isNull(val) || _.isObject(val) || _.isArray(val)) {
            return true;
        }
        try {
            JSON.parse(val);
            return true;
        } catch (err) {
            return false;
        }
    }
};

exports.CATEGORY_NAME_REGEX = CATEGORY_NAME_REGEX;
exports.COLLECTION_NAME_REGEX = COLLECTION_NAME_REGEX;
exports.ICON_REGEX = ICON_REGEX;
exports.KEBAB_BASE_REGEX = KEBAB_BASE_REGEX;
exports.NAME_REGEX = NAME_REGEX;
exports.UID_REGEX = UID_REGEX;
exports.areEnumValuesUnique = areEnumValuesUnique;
exports.isValidCategoryName = isValidCategoryName;
exports.isValidCollectionName = isValidCollectionName;
exports.isValidDefaultJSON = isValidDefaultJSON;
exports.isValidEnum = isValidEnum;
exports.isValidIcon = isValidIcon;
exports.isValidKey = isValidKey;
exports.isValidName = isValidName;
exports.isValidRegExpPattern = isValidRegExpPattern;
exports.validators = validators;
//# sourceMappingURL=common.js.map
