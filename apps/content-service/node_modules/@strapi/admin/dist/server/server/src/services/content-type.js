'use strict';

var _ = require('lodash');
var fp = require('lodash/fp');
var utils = require('@strapi/utils');
var index$2 = require('../utils/index.js');
var index = require('../domain/action/index.js');
var index$1 = require('../domain/permission/index.js');

/**
 * Creates an array of paths to the fields and nested fields, without path nodes
 */ const getNestedFields = (model, { prefix = '', nestingLevel = 15, components = {}, requiredOnly = false, existingFields = [] })=>{
    if (nestingLevel === 0) {
        return prefix ? [
            prefix
        ] : [];
    }
    const nonAuthorizableFields = utils.contentTypes.getNonVisibleAttributes(model);
    return _.reduce(model.attributes, (fields, attr, key)=>{
        if (nonAuthorizableFields.includes(key)) return fields;
        const fieldPath = prefix ? `${prefix}.${key}` : key;
        const shouldBeIncluded = !requiredOnly || attr.required === true;
        const insideExistingFields = existingFields && existingFields.some(fp.startsWith(fieldPath));
        if (attr.type === 'component') {
            if (shouldBeIncluded || insideExistingFields) {
                const compoFields = getNestedFields(components[attr.component], {
                    nestingLevel: nestingLevel - 1,
                    prefix: fieldPath,
                    components,
                    requiredOnly,
                    existingFields
                });
                if (compoFields.length === 0 && shouldBeIncluded) {
                    return fields.concat(fieldPath);
                }
                return fields.concat(compoFields);
            }
            return fields;
        }
        if (shouldBeIncluded) {
            return fields.concat(fieldPath);
        }
        return fields;
    }, []);
};
/**
 * Creates an array of paths to the fields and nested fields, with path nodes
 */ const getNestedFieldsWithIntermediate = (model, { prefix = '', nestingLevel = 15, components = {} })=>{
    if (nestingLevel === 0) {
        return [];
    }
    const nonAuthorizableFields = utils.contentTypes.getNonVisibleAttributes(model);
    return _.reduce(model.attributes, (fields, attr, key)=>{
        if (nonAuthorizableFields.includes(key)) return fields;
        const fieldPath = prefix ? `${prefix}.${key}` : key;
        fields.push(fieldPath);
        if (attr.type === 'component') {
            const compoFields = getNestedFieldsWithIntermediate(components[attr.component], {
                nestingLevel: nestingLevel - 1,
                prefix: fieldPath,
                components
            });
            fields.push(...compoFields);
        }
        return fields;
    }, []);
};
/**
 * Creates an array of permissions with the "properties.fields" attribute filled
 */ const getPermissionsWithNestedFields = (actions, { nestingLevel, restrictedSubjects = [] } = {})=>{
    return actions.reduce((permissions, action)=>{
        const validSubjects = action.subjects.filter((subject)=>!restrictedSubjects.includes(subject));
        // Create a Permission for each subject (content-type uid) within the action
        for (const subject of validSubjects){
            const fields = index.appliesToProperty('fields', action) ? getNestedFields(strapi.contentTypes[subject], {
                components: strapi.components,
                nestingLevel
            }) : undefined;
            const permission = index$1.default.create({
                action: action.actionId,
                subject,
                properties: {
                    fields
                }
            });
            permissions.push(permission);
        }
        return permissions;
    }, []);
};
/**
 * Cleans permissions' fields (add required ones, remove the non-existing ones)
 */ const cleanPermissionFields = (permissions)=>{
    const { actionProvider } = index$2.getService('permission');
    return permissions.map((permission)=>{
        const { action: actionId, subject, properties: { fields } } = permission;
        const action = actionProvider.get(actionId);
        // todo see if it's possible to check property on action + subject (async)
        if (!index.appliesToProperty('fields', action)) {
            return index$1.default.deleteProperty('fields', permission);
        }
        if (!subject || !strapi.contentTypes[subject]) {
            return permission;
        }
        const possibleFields = getNestedFieldsWithIntermediate(strapi.contentTypes[subject], {
            components: strapi.components
        });
        const currentFields = fields || [];
        const validUserFields = fp.uniq(possibleFields.filter((pf)=>currentFields.some((cf)=>pf === cf || fp.startsWith(`${cf}.`, pf))));
        // A field is considered "not nested" if no other valid user field starts with this field's path followed by a dot.
        // This helps to remove redundant parent paths when a more specific child path is already included.
        // For example, if 'component.title' is present, 'component' would be filtered out by this condition.
        const isNotNestedField = (field)=>!validUserFields.some((validUserField)=>validUserField !== field && fp.startsWith(`${field}.`, validUserField));
        // Filter out fields that are parent paths of other included fields.
        const newFields = validUserFields.filter(isNotNestedField);
        return index$1.default.setProperty('fields', newFields, permission);
    }, []);
};

exports.cleanPermissionFields = cleanPermissionFields;
exports.getNestedFields = getNestedFields;
exports.getNestedFieldsWithIntermediate = getNestedFieldsWithIntermediate;
exports.getPermissionsWithNestedFields = getPermissionsWithNestedFields;
//# sourceMappingURL=content-type.js.map
