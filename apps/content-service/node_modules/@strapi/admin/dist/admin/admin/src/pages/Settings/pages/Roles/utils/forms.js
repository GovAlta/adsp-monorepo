'use strict';

var isEmpty = require('lodash/isEmpty');
var merge = require('lodash/merge');
var permissions = require('./permissions.js');

/**
 * Creates the default condition form: { [conditionId]: false }
 */ const createDefaultConditionsForm = (conditions, initialConditions = [])=>conditions.reduce((acc, current)=>{
        acc[current.id] = initialConditions.indexOf(current.id) !== -1;
        return acc;
    }, {});
const createDefaultForm = (layout, conditions, initialPermissions = [])=>{
    return layout.reduce((acc, { categoryId, childrenForm })=>{
        const childrenDefaultForm = childrenForm.reduce((acc, current)=>{
            acc[current.subCategoryId] = current.actions.reduce((acc, current)=>{
                const foundMatchingPermission = permissions.findMatchingPermission(initialPermissions, current.action, null);
                acc[current.action] = {
                    properties: {
                        enabled: foundMatchingPermission !== undefined
                    },
                    conditions: createDefaultConditionsForm(conditions, foundMatchingPermission?.conditions ?? [])
                };
                return acc;
            }, {});
            return acc;
        }, {});
        acc[categoryId] = childrenDefaultForm;
        return acc;
    }, {});
};
/**
 * Creates the default form for all the properties found in a content type's layout
 */ const createDefaultPropertiesForm = (properties, subject, matchingPermission)=>{
    const recursivelyCreatePropertyForm = ({ children = [] }, propertyValues, prefix = '')=>{
        return children.reduce((acc, current)=>{
            if (current.children) {
                return {
                    ...acc,
                    [current.value]: recursivelyCreatePropertyForm(current, propertyValues, `${prefix}${current.value}.`)
                };
            }
            const hasProperty = propertyValues.indexOf(`${prefix}${current.value}`) !== -1;
            acc[current.value] = hasProperty;
            return acc;
        }, {});
    };
    return properties.reduce((acc, currentPropertyName)=>{
        const foundProperty = subject.properties.find(({ value })=>value === currentPropertyName);
        if (foundProperty) {
            const matchingPermissionPropertyValues = matchingPermission?.properties[foundProperty.value] ?? [];
            const propertyForm = recursivelyCreatePropertyForm(foundProperty, matchingPermissionPropertyValues);
            acc.properties[currentPropertyName] = propertyForm;
        }
        return acc;
    }, {
        properties: {}
    });
};
/**
 * Creates the default for for a content type
 */ const createDefaultCTForm = ({ subjects, actions = [] }, conditions, initialPermissions = [])=>{
    return actions.reduce((defaultForm, action)=>{
        const subjectLayouts = action.subjects.reduce((acc, current)=>{
            const foundLayout = subjects.find(({ uid })=>uid === current) || null;
            if (foundLayout) {
                acc[current] = foundLayout;
            }
            return acc;
        }, {});
        // This can happen when an action is not related to a content type
        // for instance the D&P permission is applied only with the cts that
        // have the D&P features enabled
        if (isEmpty(subjectLayouts)) {
            return defaultForm;
        }
        // The object has the following shape: { [ctUID]: { [actionId]: { [property]: { enabled: false } } } }
        const contentTypesActions = Object.keys(subjectLayouts).reduce((acc, currentCTUID)=>{
            const { actionId, applyToProperties } = action;
            const currentSubjectLayout = subjectLayouts[currentCTUID];
            const properties = currentSubjectLayout.properties.map(({ value })=>value);
            const doesNothaveProperty = properties.every((property)=>(applyToProperties || []).indexOf(property) === -1);
            const matchingPermission = permissions.findMatchingPermission(initialPermissions, actionId, currentCTUID);
            const conditionsForm = createDefaultConditionsForm(conditions, matchingPermission?.conditions ?? []);
            if (!acc[currentCTUID]) {
                acc[currentCTUID] = {};
            }
            if (isEmpty(applyToProperties) || doesNothaveProperty) {
                acc[currentCTUID][actionId] = {
                    properties: {
                        enabled: matchingPermission !== undefined
                    },
                    conditions: conditionsForm
                };
                return acc;
            }
            const propertiesForm = createDefaultPropertiesForm(applyToProperties, subjectLayouts[currentCTUID], matchingPermission);
            acc[currentCTUID][actionId] = {
                ...propertiesForm,
                conditions: conditionsForm
            };
            return acc;
        }, {});
        return merge(defaultForm, contentTypesActions);
    }, {});
};

exports.createDefaultCTForm = createDefaultCTForm;
exports.createDefaultConditionsForm = createDefaultConditionsForm;
exports.createDefaultForm = createDefaultForm;
//# sourceMappingURL=forms.js.map
