'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var fp = require('lodash/fp');

const permissionFields = [
    'id',
    'action',
    'actionParameters',
    'subject',
    'properties',
    'conditions',
    'role'
];
const sanitizedPermissionFields = [
    'id',
    'action',
    'actionParameters',
    'subject',
    'properties',
    'conditions'
];
const sanitizePermissionFields = fp.pick(sanitizedPermissionFields);
/**
 * Creates a permission with default values
 */ const getDefaultPermission = ()=>({
        actionParameters: {},
        conditions: [],
        properties: {},
        subject: null
    });
/**
 * Returns a new permission with the given condition
 * @param condition - The condition to add
 * @param permission - The permission on which we want to add the condition
 * @return
 */ const addCondition = fp.curry((condition, permission)=>{
    const { conditions } = permission;
    const newConditions = Array.isArray(conditions) ? fp.uniq(conditions.concat(condition)) : [
        condition
    ];
    return fp.set('conditions', newConditions, permission);
});
/**
 * Returns a new permission without the given condition
 * @param condition - The condition to remove
 * @param permission - The permission on which we want to remove the condition
 */ const removeCondition = fp.curry((condition, permission)=>{
    return fp.set('conditions', fp.remove(fp.eq(condition), permission.conditions), permission);
});
/**
 * Gets a property or a part of a property from a permission.
 * @param property - The property to get
 * @param permission - The permission on which we want to access the property
 */ const getProperty = fp.curry((property, permission)=>fp.get(`properties.${property}`, permission));
/**
 * Set a value for a given property on a new permission object
 * @param property - The name of the property
 * @param value - The value of the property
 * @param permission - The permission on which we want to set the property
 */ const setProperty = (property, value, permission)=>{
    return fp.set(`properties.${property}`, value, permission);
};
/**
 * Returns a new permission without the given property name set
 * @param property - The name of the property to delete
 * @param permission - The permission on which we want to remove the property
 */ const deleteProperty = (property, permission)=>fp.omit(`properties.${property}`, permission);
/**
 * Creates a new {@link Permission} object from raw attributes. Set default values for certain fields
 * @param  attributes
 */ const create = (attributes)=>{
    return fp.pipe(fp.pick(permissionFields), fp.merge(getDefaultPermission()))(attributes);
};
/**
 * Using the given condition provider, check and remove invalid condition from the permission's condition array.
 * @param provider - The condition provider used to do the checks
 * @param permission - The condition to sanitize
 */ const sanitizeConditions = fp.curry((provider, permission)=>{
    if (!fp.isArray(permission.conditions)) {
        return permission;
    }
    return permission.conditions.filter((condition)=>!provider.has(condition)).reduce((perm, condition)=>removeCondition(condition, perm), permission);
});
function toPermission(payload) {
    if (fp.isArray(payload)) {
        return fp.map((value)=>create(value), payload);
    }
    return create(payload);
}
var permissionDomain = {
    addCondition,
    removeCondition,
    create,
    deleteProperty,
    permissionFields,
    getProperty,
    sanitizedPermissionFields,
    sanitizeConditions,
    sanitizePermissionFields,
    setProperty,
    toPermission
};

exports.addCondition = addCondition;
exports.create = create;
exports.default = permissionDomain;
exports.deleteProperty = deleteProperty;
exports.getProperty = getProperty;
exports.permissionFields = permissionFields;
exports.removeCondition = removeCondition;
exports.sanitizeConditions = sanitizeConditions;
exports.sanitizePermissionFields = sanitizePermissionFields;
exports.sanitizedPermissionFields = sanitizedPermissionFields;
exports.setProperty = setProperty;
exports.toPermission = toPermission;
//# sourceMappingURL=index.js.map
