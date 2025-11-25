import { difference, isArray, isEmpty, curry } from 'lodash/fp';
import permissions from '@strapi/permissions';
import permissionDomain from '../../domain/permission/index.mjs';
import { getService } from '../../utils/index.mjs';

var createPermissionEngine = ((params)=>{
    const { providers } = params;
    const engine = permissions.engine.new({
        providers
    })/**
     * Validate the permission's action exists in the action registry
     */ .on('before-format::validate.permission', ({ permission })=>{
        const action = providers.action.get(permission.action);
        // If the action isn't registered into the action provider, then ignore the permission
        if (!action) {
            strapi.log.debug(`Unknown action "${permission.action}" supplied when registering a new permission in engine`);
            return false;
        }
    })/**
     * Remove invalid properties from the permission based on the action (applyToProperties)
     */ .on('format.permission', (permission)=>{
        const action = providers.action.get(permission.action);
        const properties = permission.properties || {};
        // Only keep the properties allowed by the action (action.applyToProperties)
        const propertiesName = Object.keys(properties);
        const invalidProperties = difference(propertiesName, // @ts-expect-error - applyToProperties is defined inside the options of an action
        action.applyToProperties || propertiesName);
        const permissionWithSanitizedProperties = invalidProperties.reduce(// @ts-expect-error - fix reduce, property should be a string but it's actually the permission object
        (property)=>permissionDomain.deleteProperty(property, permission), permission);
        return permissionWithSanitizedProperties;
    })/**
     * Ignore the permission if the fields property is an empty array (access to no field)
     */ .on('after-format::validate.permission', ({ permission })=>{
        const { fields } = permission.properties;
        if (isArray(fields) && isEmpty(fields)) {
            return false;
        }
    });
    return {
        get hooks () {
            return engine.hooks;
        },
        /**
     * Generate an ability based on the given user (using associated roles & permissions)
     * @param user
     */ async generateUserAbility (user) {
            const permissions = await getService('permission').findUserPermissions(user);
            return engine.generateAbility(permissions, user);
        },
        /**
     * Check many permissions based on an ability
     */ checkMany: curry((ability, permissions)=>{
            // @ts-expect-error - Permissions does not contain any field property
            return permissions.map(({ action, subject, field })=>ability.can(action, subject, field));
        })
    };
});

export { createPermissionEngine as default };
//# sourceMappingURL=engine.mjs.map
