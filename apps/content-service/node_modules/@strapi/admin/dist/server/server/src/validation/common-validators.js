'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var utils = require('@strapi/utils');
var _ = require('lodash');
var fp = require('lodash/fp');
var index$1 = require('../utils/index.js');
var index = require('../domain/action/index.js');
var checkFieldsAreCorrectlyNested = require('./common-functions/check-fields-are-correctly-nested.js');
var checkFieldsDontHaveDuplicates = require('./common-functions/check-fields-dont-have-duplicates.js');

const getActionFromProvider = (actionId)=>{
    return index$1.getService('permission').actionProvider.get(actionId);
};
const email = utils.yup.string().email().lowercase();
const firstname = utils.yup.string().trim().min(1);
const lastname = utils.yup.string();
const username = utils.yup.string().min(1);
const password = utils.yup.string().min(8).test('required-byte-size', '${path} must be less than 73 bytes', function(value) {
    if (!value) return true;
    const byteSize = new TextEncoder().encode(value).length;
    return byteSize <= 72;
}).matches(/[a-z]/, '${path} must contain at least one lowercase character').matches(/[A-Z]/, '${path} must contain at least one uppercase character').matches(/\d/, '${path} must contain at least one number');
const roles = utils.yup.array(utils.yup.strapiID()).min(1);
const isAPluginName = utils.yup.string().test('is-a-plugin-name', 'is not a plugin name', function(value) {
    return [
        undefined,
        'admin',
        ...Object.keys(strapi.plugins)
    ].includes(value) ? true : this.createError({
        path: this.path,
        message: `${this.path} is not an existing plugin`
    });
});
const arrayOfConditionNames = utils.yup.array().of(utils.yup.string()).test('is-an-array-of-conditions', 'is not a plugin name', function(value) {
    const ids = strapi.service('admin::permission').conditionProvider.keys();
    return _.isUndefined(value) || _.difference(value, ids).length === 0 ? true : this.createError({
        path: this.path,
        message: `contains conditions that don't exist`
    });
});
const permissionsAreEquals = (a, b)=>a.action === b.action && (a.subject === b.subject || _.isNil(a.subject) && _.isNil(b.subject));
const checkNoDuplicatedPermissions = (permissions)=>!Array.isArray(permissions) || permissions.every((permA, i)=>permissions.slice(i + 1).every((permB)=>!permissionsAreEquals(permA, permB)));
const checkNilFields = (action)=>function(fields) {
        // If the parent has no action field, then we ignore this test
        if (fp.isNil(action)) {
            return true;
        }
        return index.appliesToProperty('fields', action) || fp.isNil(fields);
    };
const fieldsPropertyValidation = (action)=>utils.yup.array().of(utils.yup.string()).nullable().test('field-nested', 'Fields format are incorrect (bad nesting).', checkFieldsAreCorrectlyNested).test('field-nested', 'Fields format are incorrect (duplicates).', checkFieldsDontHaveDuplicates).test('fields-restriction', 'The permission at ${path} must have fields set to null or undefined', // @ts-expect-error yup types
    checkNilFields(action));
const permission = utils.yup.object().shape({
    action: utils.yup.string().required().test('action-validity', 'action is not an existing permission action', function(actionId) {
        // If the action field is Nil, ignore the test and let the required check handle the error
        if (fp.isNil(actionId)) {
            return true;
        }
        return !!getActionFromProvider(actionId);
    }),
    actionParameters: utils.yup.object().nullable(),
    subject: utils.yup.string().nullable().test('subject-validity', 'Invalid subject submitted', function(subject) {
        // @ts-expect-error yup types
        const action = getActionFromProvider(this.options.parent.action);
        if (!action) {
            return true;
        }
        if (fp.isNil(action.subjects)) {
            return fp.isNil(subject);
        }
        if (fp.isArray(action.subjects) && !fp.isNil(subject)) {
            return action.subjects.includes(subject);
        }
        return false;
    }),
    properties: utils.yup.object().test('properties-structure', 'Invalid property set at ${path}', function(properties) {
        // @ts-expect-error yup types
        const action = getActionFromProvider(this.options.parent.action);
        const hasNoProperties = fp.isEmpty(properties) || fp.isNil(properties);
        if (!fp.has('options.applyToProperties', action)) {
            return hasNoProperties;
        }
        if (hasNoProperties) {
            return true;
        }
        const { applyToProperties } = action.options;
        if (!fp.isArray(applyToProperties)) {
            return false;
        }
        return Object.keys(properties).every((property)=>applyToProperties.includes(property));
    }).test('fields-property', 'Invalid fields property at ${path}', async function(properties = {}) {
        // @ts-expect-error yup types
        const action = getActionFromProvider(this.options.parent.action);
        if (!action || !properties) {
            return true;
        }
        if (!index.appliesToProperty('fields', action)) {
            return true;
        }
        try {
            await fieldsPropertyValidation(action).validate(properties.fields, {
                strict: true,
                abortEarly: false
            });
            return true;
        } catch (e) {
            // Propagate fieldsPropertyValidation error with updated path
            throw this.createError({
                message: e.message,
                path: `${this.path}.fields`
            });
        }
    }),
    conditions: utils.yup.array().of(utils.yup.string())
}).noUnknown();
const updatePermissions = utils.yup.object().shape({
    permissions: utils.yup.array().required().of(permission).test('duplicated-permissions', 'Some permissions are duplicated (same action and subject)', checkNoDuplicatedPermissions)
}).required().noUnknown();
var validators = {
    email,
    firstname,
    lastname,
    username,
    password,
    roles,
    isAPluginName,
    arrayOfConditionNames,
    permission,
    updatePermissions
};

exports.arrayOfConditionNames = arrayOfConditionNames;
exports.default = validators;
exports.email = email;
exports.firstname = firstname;
exports.lastname = lastname;
exports.password = password;
exports.permission = permission;
exports.permissionsAreEquals = permissionsAreEquals;
exports.roles = roles;
exports.updatePermissions = updatePermissions;
exports.username = username;
//# sourceMappingURL=common-validators.js.map
