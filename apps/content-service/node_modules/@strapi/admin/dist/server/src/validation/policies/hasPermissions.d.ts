import { yup } from '@strapi/utils';
export declare const validateHasPermissionsInput: (body: unknown, errorMessage?: string | undefined) => Promise<import("yup/lib/object").AssertsShape<{
    actions: yup.ArraySchema<yup.AnySchema, import("yup/lib/types").AnyObject, any[] | undefined, any[] | undefined>;
}>>;
declare const _default: {
    validateHasPermissionsInput: (body: unknown, errorMessage?: string | undefined) => Promise<import("yup/lib/object").AssertsShape<{
        actions: yup.ArraySchema<yup.AnySchema, import("yup/lib/types").AnyObject, any[] | undefined, any[] | undefined>;
    }>>;
};
export default _default;
//# sourceMappingURL=hasPermissions.d.ts.map