import { isObject } from '../../../../../utils/objects.mjs';
import { createArrayOfValues } from './createArrayOfValues.mjs';

/**
 * @description Given a users permissions array we find the first one that matches a provided subject & action
 */ const findMatchingPermission = (permissions, action, subject)=>permissions.find((perm)=>perm.action === action && perm.subject === subject);
const formatPermissionsForAPI = (modifiedData)=>{
    const pluginsPermissions = formatSettingsPermissions(modifiedData.plugins);
    const settingsPermissions = formatSettingsPermissions(modifiedData.settings);
    const collectionTypesPermissions = formatContentTypesPermissions(modifiedData.collectionTypes);
    const singleTypesPermissions = formatContentTypesPermissions(modifiedData.singleTypes);
    return [
        ...pluginsPermissions,
        ...settingsPermissions,
        ...collectionTypesPermissions,
        ...singleTypesPermissions
    ];
};
const formatSettingsPermissions = (settingsPermissionsObject)=>{
    return Object.values(settingsPermissionsObject).reduce((formAcc, form)=>{
        const currentCategoryPermissions = Object.values(form).reduce((childFormAcc, childForm)=>{
            const permissions = Object.entries(childForm).reduce((responsesAcc, [actionName, { conditions, properties: { enabled } }])=>{
                if (!enabled) {
                    return responsesAcc;
                }
                responsesAcc.push({
                    action: actionName,
                    subject: null,
                    conditions: createConditionsArray(conditions),
                    properties: {}
                });
                return responsesAcc;
            }, []);
            return [
                ...childFormAcc,
                ...permissions
            ];
        }, []);
        return [
            ...formAcc,
            ...currentCategoryPermissions
        ];
    }, []);
};
const formatContentTypesPermissions = (contentTypesPermissions)=>{
    const permissions = Object.entries(contentTypesPermissions).reduce((allPermissions, current)=>{
        const [subject, currentSubjectActions] = current;
        const permissions = Object.entries(currentSubjectActions).reduce((acc, current)=>{
            const [actionName, permissions] = current;
            const shouldCreatePermission = createArrayOfValues(permissions).some((val)=>val);
            if (!shouldCreatePermission) {
                return acc;
            }
            if (!permissions?.properties?.enabled) {
                const createdPermissionsArray = Object.entries(permissions.properties).reduce((acc, current)=>{
                    const [propertyName, propertyValue] = current;
                    // @ts-expect-error – `propertyValue` can be boolean or an object, but we don't account for it...
                    acc.properties[propertyName] = createPropertyArray(propertyValue);
                    return acc;
                }, {
                    action: actionName,
                    subject,
                    conditions: createConditionsArray(permissions.conditions),
                    properties: {}
                });
                return [
                    ...acc,
                    createdPermissionsArray
                ];
            }
            if (!permissions.properties.enabled) {
                return acc;
            }
            acc.push({
                action: actionName,
                subject,
                properties: {},
                conditions: createConditionsArray(permissions.conditions)
            });
            return acc;
        }, []);
        return [
            ...allPermissions,
            ...permissions
        ];
    }, []);
    return permissions;
};
const createPropertyArray = (propertyValue, prefix = '')=>{
    return Object.entries(propertyValue).reduce((acc, current)=>{
        const [name, value] = current;
        if (isObject(value)) {
            return [
                ...acc,
                ...createPropertyArray(value, `${prefix}${name}.`)
            ];
        }
        if (value && !isObject(value)) {
            acc.push(`${prefix}${name}`);
        }
        return acc;
    }, []);
};
const createConditionsArray = (conditions)=>Object.entries(conditions).filter(([, conditionValue])=>{
        return conditionValue;
    }).map(([conditionName])=>conditionName);

export { findMatchingPermission, formatPermissionsForAPI };
//# sourceMappingURL=permissions.mjs.map
