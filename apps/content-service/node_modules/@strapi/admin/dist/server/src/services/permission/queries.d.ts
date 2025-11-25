import type { Data } from '@strapi/types';
import { CreatePermissionPayload } from '../../domain/permission';
import type { AdminUser, Permission } from '../../../../shared/contracts/shared';
/**
 * Delete permissions of roles in database
 * @param rolesIds ids of roles
 */
export declare const deleteByRolesIds: (rolesIds: Data.ID[]) => Promise<void>;
/**
 * Delete permissions
 * @param ids ids of permissions
 */
export declare const deleteByIds: (ids: Data.ID[]) => Promise<void>;
/**
 * Create many permissions
 * @param permissions
 */
export declare const createMany: (permissions: CreatePermissionPayload[]) => Promise<Permission[]>;
/**
 * Find assigned permissions in the database
 * @param params query params to find the permissions
 */
export declare const findMany: (params?: {}) => Promise<Permission[]>;
/**
 * Find all permissions for a user
 * @param user - user
 */
export declare const findUserPermissions: (user: AdminUser) => Promise<Permission[]>;
/**
 * Removes permissions in database that don't exist anymore
 */
export declare const cleanPermissionsInDatabase: () => Promise<void>;
declare const _default: {
    createMany: (permissions: CreatePermissionPayload[]) => Promise<Permission[]>;
    findMany: (params?: {}) => Promise<Permission[]>;
    deleteByRolesIds: (rolesIds: Data.ID[]) => Promise<void>;
    deleteByIds: (ids: Data.ID[]) => Promise<void>;
    findUserPermissions: (user: AdminUser) => Promise<Permission[]>;
    cleanPermissionsInDatabase: () => Promise<void>;
};
export default _default;
//# sourceMappingURL=queries.d.ts.map