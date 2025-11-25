import { ProhibitedCloningField } from '../../../../shared/contracts/collection-types';
declare const getProhibitedCloningFields: (uid: any, pathPrefix?: string[]) => ProhibitedCloningField[];
/**
 * Iterates all attributes of the content type, and removes the ones that are not creatable.
 *   - If it's a relation, it sets the value to [] or null.
 *   - If it's a regular attribute, it sets the value to null.
 * When cloning, if you don't set a field it will be copied from the original entry. So we need to
 * remove the fields that the user can't create.
 */
declare const excludeNotCreatableFields: (uid: any, permissionChecker: any) => (body: any, path?: never[]) => any;
export { getProhibitedCloningFields, excludeNotCreatableFields };
//# sourceMappingURL=clone.d.ts.map