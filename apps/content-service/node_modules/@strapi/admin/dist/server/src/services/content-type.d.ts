import type { Modules, Struct } from '@strapi/types';
interface FieldOptions {
    prefix?: string;
    nestingLevel?: number;
    requiredOnly?: boolean;
    existingFields?: string[];
    restrictedSubjects?: string[];
    components?: {
        [key: string]: any;
    };
}
/**
 * Creates an array of paths to the fields and nested fields, without path nodes
 */
declare const getNestedFields: (model: Struct.ContentTypeSchema, { prefix, nestingLevel, components, requiredOnly, existingFields, }: FieldOptions) => string[];
/**
 * Creates an array of paths to the fields and nested fields, with path nodes
 */
declare const getNestedFieldsWithIntermediate: (model: Struct.ContentTypeSchema, { prefix, nestingLevel, components }: FieldOptions) => string[];
/**
 * Creates an array of permissions with the "properties.fields" attribute filled
 */
declare const getPermissionsWithNestedFields: (actions: any[], { nestingLevel, restrictedSubjects }?: FieldOptions) => Modules.Permissions.PermissionRule[];
/**
 * Cleans permissions' fields (add required ones, remove the non-existing ones)
 */
declare const cleanPermissionFields: (permissions: Modules.Permissions.PermissionRule[]) => Modules.Permissions.PermissionRule[];
export { getNestedFields, getPermissionsWithNestedFields, cleanPermissionFields, getNestedFieldsWithIntermediate, };
//# sourceMappingURL=content-type.d.ts.map