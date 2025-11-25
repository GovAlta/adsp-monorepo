'use strict';

var strapiUtils = require('@strapi/utils');

const ACTIONS = {
    read: 'plugin::content-manager.explorer.read',
    create: 'plugin::content-manager.explorer.create',
    update: 'plugin::content-manager.explorer.update',
    delete: 'plugin::content-manager.explorer.delete',
    publish: 'plugin::content-manager.explorer.publish',
    unpublish: 'plugin::content-manager.explorer.publish',
    discard: 'plugin::content-manager.explorer.update'
};
const createPermissionChecker = (strapi)=>({ userAbility, model })=>{
        const permissionsManager = strapi.service('admin::permission').createPermissionsManager({
            ability: userAbility,
            model
        });
        const { actionProvider } = strapi.service('admin::permission');
        const toSubject = (entity)=>{
            return entity ? permissionsManager.toSubject(entity, model) : model;
        };
        // @ts-expect-error preserve the parameter order
        // eslint-disable-next-line @typescript-eslint/default-param-last
        const can = (action, entity, field)=>{
            const subject = toSubject(entity);
            const aliases = actionProvider.unstable_aliases(action, model);
            return(// Test the original action to see if it passes
            userAbility.can(action, subject, field) || // Else try every known alias if at least one of them succeed, then the user "can"
            aliases.some((alias)=>userAbility.can(alias, subject, field)));
        };
        // @ts-expect-error preserve the parameter order
        // eslint-disable-next-line @typescript-eslint/default-param-last
        const cannot = (action, entity, field)=>{
            const subject = toSubject(entity);
            const aliases = actionProvider.unstable_aliases(action, model);
            return(// Test both the original action
            userAbility.cannot(action, subject, field) && // and every known alias, if all of them fail (cannot), then the user truly "cannot"
            aliases.every((alias)=>userAbility.cannot(alias, subject, field)));
        };
        const sanitizeOutput = (data, { action = ACTIONS.read } = {})=>{
            return permissionsManager.sanitizeOutput(data, {
                subject: toSubject(data),
                action
            });
        };
        const sanitizeQuery = (query, { action = ACTIONS.read } = {})=>{
            return permissionsManager.sanitizeQuery(query, {
                subject: model,
                action
            });
        };
        const sanitizeInput = (action, data, entity)=>{
            return permissionsManager.sanitizeInput(data, {
                subject: entity ? toSubject(entity) : model,
                action
            });
        };
        const validateQuery = (query, { action = ACTIONS.read } = {})=>{
            return permissionsManager.validateQuery(query, {
                subject: model,
                action
            });
        };
        const validateInput = (action, data, entity)=>{
            return permissionsManager.validateInput(data, {
                subject: entity ? toSubject(entity) : model,
                action
            });
        };
        const sanitizeCreateInput = (data)=>sanitizeInput(ACTIONS.create, data);
        const sanitizeUpdateInput = (entity)=>(data)=>sanitizeInput(ACTIONS.update, data, entity);
        const buildPermissionQuery = (query, action = {})=>{
            return permissionsManager.addPermissionsQueryTo(query, action);
        };
        const sanitizedQuery = (query, action = {})=>{
            return strapiUtils.async.pipe((q)=>sanitizeQuery(q, action), (q)=>buildPermissionQuery(q, action))(query);
        };
        // Sanitized queries shortcuts
        Object.keys(ACTIONS).forEach((action)=>{
            // @ts-expect-error TODO
            sanitizedQuery[action] = (query)=>sanitizedQuery(query, ACTIONS[action]);
        });
        // Permission utils shortcuts
        Object.keys(ACTIONS).forEach((action)=>{
            // @ts-expect-error TODO
            can[action] = (...args)=>can(ACTIONS[action], ...args);
            // @ts-expect-error TODO
            cannot[action] = (...args)=>cannot(ACTIONS[action], ...args);
        });
        return {
            // Permission utils
            can,
            cannot,
            // Sanitizers
            sanitizeOutput,
            sanitizeQuery,
            sanitizeCreateInput,
            sanitizeUpdateInput,
            // Validators
            validateQuery,
            validateInput,
            // Queries Builder
            sanitizedQuery
        };
    };
var permissionChecker = (({ strapi })=>({
        create: createPermissionChecker(strapi)
    }));

module.exports = permissionChecker;
//# sourceMappingURL=permission-checker.js.map
