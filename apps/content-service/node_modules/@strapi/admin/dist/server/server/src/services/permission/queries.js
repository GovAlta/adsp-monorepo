'use strict';

var fp = require('lodash/fp');
var pmap = require('p-map');
var index$1 = require('../../utils/index.js');
var index = require('../../domain/permission/index.js');

/**
 * Delete permissions of roles in database
 * @param rolesIds ids of roles
 */ const deleteByRolesIds = async (rolesIds)=>{
    const permissionsToDelete = await strapi.db.query('admin::permission').findMany({
        select: [
            'id'
        ],
        where: {
            role: {
                id: rolesIds
            }
        }
    });
    if (permissionsToDelete.length > 0) {
        await deleteByIds(permissionsToDelete.map(fp.prop('id')));
    }
};
/**
 * Delete permissions
 * @param ids ids of permissions
 */ const deleteByIds = async (ids)=>{
    const result = [];
    for (const id of ids){
        const queryResult = await strapi.db.query('admin::permission').delete({
            where: {
                id
            }
        });
        result.push(queryResult);
    }
    strapi.eventHub.emit('permission.delete', {
        permissions: result
    });
};
/**
 * Create many permissions
 * @param permissions
 */ const createMany = async (permissions)=>{
    const createdPermissions = [];
    for (const permission of permissions){
        const newPerm = await strapi.db.query('admin::permission').create({
            data: permission
        });
        createdPermissions.push(newPerm);
    }
    const permissionsToReturn = index.default.toPermission(createdPermissions);
    strapi.eventHub.emit('permission.create', {
        permissions: permissionsToReturn
    });
    return permissionsToReturn;
};
/**
 * Update a permission
 * @param params
 * @param attributes
 */ const update = async (params, attributes)=>{
    const updatedPermission = await strapi.db.query('admin::permission').update({
        where: params,
        data: attributes
    });
    const permissionToReturn = index.default.toPermission(updatedPermission);
    strapi.eventHub.emit('permission.update', {
        permissions: permissionToReturn
    });
    return permissionToReturn;
};
/**
 * Find assigned permissions in the database
 * @param params query params to find the permissions
 */ const findMany = async (params = {})=>{
    const rawPermissions = await strapi.db.query('admin::permission').findMany(params);
    return index.default.toPermission(rawPermissions);
};
/**
 * Find all permissions for a user
 * @param user - user
 */ const findUserPermissions = async (user)=>{
    return findMany({
        where: {
            role: {
                users: {
                    id: user.id
                }
            }
        }
    });
};
const filterPermissionsToRemove = async (permissions)=>{
    const { actionProvider } = index$1.getService('permission');
    const permissionsToRemove = [];
    for (const permission of permissions){
        const { subjects, options = {} } = actionProvider.get(permission.action) || {};
        const { applyToProperties } = options;
        const invalidProperties = await Promise.all((applyToProperties || []).map(async (property)=>{
            const applies = await actionProvider.appliesToProperty(property, permission.action, permission.subject);
            return applies && fp.isNil(index.default.getProperty(property, permission));
        }));
        const isRegisteredAction = actionProvider.has(permission.action);
        const hasInvalidProperties = fp.isArray(applyToProperties) && invalidProperties.every(fp.eq(true));
        const isInvalidSubject = fp.isArray(subjects) && !subjects.includes(permission.subject);
        // If the permission has an invalid action, an invalid subject or invalid properties, then add it to the toBeRemoved collection
        if (!isRegisteredAction || isInvalidSubject || hasInvalidProperties) {
            permissionsToRemove.push(permission);
        }
    }
    return permissionsToRemove;
};
/**
 * Removes permissions in database that don't exist anymore
 */ const cleanPermissionsInDatabase = async ()=>{
    const pageSize = 200;
    const contentTypeService = index$1.getService('content-type');
    const total = await strapi.db.query('admin::permission').count();
    const pageCount = Math.ceil(total / pageSize);
    for(let page = 0; page < pageCount; page += 1){
        // 1. Find invalid permissions and collect their ID to delete them later
        const results = await strapi.db.query('admin::permission').findMany({
            limit: pageSize,
            offset: page * pageSize
        });
        const permissions = index.default.toPermission(results);
        const permissionsToRemove = await filterPermissionsToRemove(permissions);
        const permissionsIdToRemove = fp.map(fp.prop('id'), permissionsToRemove);
        // 2. Clean permissions' fields (add required ones, remove the non-existing ones)
        const remainingPermissions = permissions.filter((permission)=>!permissionsIdToRemove.includes(permission.id));
        const permissionsWithCleanFields = contentTypeService.cleanPermissionFields(remainingPermissions);
        // Update only the ones that need to be updated
        const permissionsNeedingToBeUpdated = fp.differenceWith((a, b)=>{
            return a.id === b.id && fp.xor(a.properties.fields, b.properties.fields).length === 0;
        }, permissionsWithCleanFields, remainingPermissions);
        const updatePromiseProvider = (permission)=>{
            return update({
                id: permission.id
            }, permission);
        };
        // Execute all the queries, update the database
        await Promise.all([
            deleteByIds(permissionsIdToRemove),
            pmap(permissionsNeedingToBeUpdated, updatePromiseProvider, {
                concurrency: 100,
                stopOnError: true
            })
        ]);
    }
};

exports.cleanPermissionsInDatabase = cleanPermissionsInDatabase;
exports.createMany = createMany;
exports.deleteByIds = deleteByIds;
exports.deleteByRolesIds = deleteByRolesIds;
exports.findMany = findMany;
exports.findUserPermissions = findUserPermissions;
//# sourceMappingURL=queries.js.map
