/// <reference types="lodash" />
import type { Utils } from '@strapi/types';
import { Permission } from '../../../../shared/contracts/shared';
import { SanitizedPermission } from '../../../../shared/contracts/roles';
export type CreatePermissionPayload = Utils.Object.PartialBy<Permission, 'actionParameters' | 'conditions' | 'properties' | 'subject' | 'id' | 'createdAt' | 'updatedAt'>;
export declare const permissionFields: string[];
export declare const sanitizedPermissionFields: readonly ["id", "action", "actionParameters", "subject", "properties", "conditions"];
export declare const sanitizePermissionFields: (p: Permission) => SanitizedPermission;
/**
 * Returns a new permission with the given condition
 * @param condition - The condition to add
 * @param permission - The permission on which we want to add the condition
 * @return
 */
export declare const addCondition: import("lodash").CurriedFunction2<string, Permission, Permission>;
/**
 * Returns a new permission without the given condition
 * @param condition - The condition to remove
 * @param permission - The permission on which we want to remove the condition
 */
export declare const removeCondition: import("lodash").CurriedFunction2<string, Permission, Permission>;
/**
 * Gets a property or a part of a property from a permission.
 * @param property - The property to get
 * @param permission - The permission on which we want to access the property
 */
export declare const getProperty: import("lodash").CurriedFunction2<string, Permission, Permission>;
/**
 * Set a value for a given property on a new permission object
 * @param property - The name of the property
 * @param value - The value of the property
 * @param permission - The permission on which we want to set the property
 */
export declare const setProperty: (property: string, value: unknown, permission: Permission) => Permission;
/**
 * Returns a new permission without the given property name set
 * @param property - The name of the property to delete
 * @param permission - The permission on which we want to remove the property
 */
export declare const deleteProperty: <TProperty extends string>(property: TProperty, permission: Permission) => Omit<Permission, TProperty>;
/**
 * Creates a new {@link Permission} object from raw attributes. Set default values for certain fields
 * @param  attributes
 */
export declare const create: (attributes: CreatePermissionPayload) => Permission;
/**
 * Using the given condition provider, check and remove invalid condition from the permission's condition array.
 * @param provider - The condition provider used to do the checks
 * @param permission - The condition to sanitize
 */
export declare const sanitizeConditions: import("lodash").CurriedFunction2<import("@strapi/utils/dist/provider-factory").Provider<unknown>, Permission, Permission>;
/**
 * Transform raw attributes into valid permissions using the create domain function.
 * @param  payload - Can either be a single object of attributes or an array of those objects.
 */
declare function toPermission<T extends CreatePermissionPayload>(payload: T[]): Permission[];
declare function toPermission<T extends CreatePermissionPayload>(payload: T): Permission;
export { toPermission };
declare const _default: {
    addCondition: import("lodash").CurriedFunction2<string, Permission, Permission>;
    removeCondition: import("lodash").CurriedFunction2<string, Permission, Permission>;
    create: (attributes: CreatePermissionPayload) => Permission;
    deleteProperty: <TProperty extends string>(property: TProperty, permission: Permission) => Omit<Permission, TProperty>;
    permissionFields: string[];
    getProperty: import("lodash").CurriedFunction2<string, Permission, Permission>;
    sanitizedPermissionFields: readonly ["id", "action", "actionParameters", "subject", "properties", "conditions"];
    sanitizeConditions: import("lodash").CurriedFunction2<import("@strapi/utils/dist/provider-factory").Provider<unknown>, Permission, Permission>;
    sanitizePermissionFields: (p: Permission) => SanitizedPermission;
    setProperty: (property: string, value: unknown, permission: Permission) => Permission;
    toPermission: typeof toPermission;
};
export default _default;
//# sourceMappingURL=index.d.ts.map