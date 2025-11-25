/// <reference types="lodash" />
import _ from 'lodash/fp';
declare const sanitizePermissionFields: _.LodashPick2x1;
export interface Permission {
    action: string;
    actionParameters?: Record<string, unknown>;
    subject?: string | object | null;
    properties?: Record<string, any>;
    conditions?: string[];
}
/**
 * Create a new permission based on given attributes
 *
 * @param {object} attributes
 */
declare const create: <T>(object: T | null | undefined) => Pick<Permission, "subject" | "properties" | "conditions"> & Partial<T>;
/**
 * Add a condition to a permission
 */
declare const addCondition: import("lodash").CurriedFunction2<string, Permission, Permission>;
/**
 * Gets a property or a part of a property from a permission.
 */
declare const getProperty: (...args: any[]) => any;
export { create, sanitizePermissionFields, addCondition, getProperty };
//# sourceMappingURL=index.d.ts.map