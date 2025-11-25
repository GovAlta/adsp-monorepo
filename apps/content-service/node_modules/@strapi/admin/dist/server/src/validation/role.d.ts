import { yup } from '@strapi/utils';
export declare const validateRoleCreateInput: (body: unknown, errorMessage?: string | undefined) => Promise<import("yup/lib/object").AssertsShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
    name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    description: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
}>>>;
export declare const validateRoleUpdateInput: (body: unknown, errorMessage?: string | undefined) => Promise<import("yup/lib/object").AssertsShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
    name: import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
    description: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
}>>>;
export declare const validateRolesDeleteInput: (body: unknown, errorMessage?: string | undefined) => Promise<import("yup/lib/object").AssertsShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
    ids: import("yup/lib/array").RequiredArraySchema<yup.StrapiIDSchema, import("yup/lib/types").AnyObject, any[] | undefined>;
}>>>;
export declare const validateRoleDeleteInput: (body: unknown, errorMessage?: string | undefined) => Promise<any>;
declare const _default: {
    validateRoleUpdateInput: (body: unknown, errorMessage?: string | undefined) => Promise<import("yup/lib/object").AssertsShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
        name: import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
        description: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
    }>>>;
    validateRoleCreateInput: (body: unknown, errorMessage?: string | undefined) => Promise<import("yup/lib/object").AssertsShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        description: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
    }>>>;
    validateRolesDeleteInput: (body: unknown, errorMessage?: string | undefined) => Promise<import("yup/lib/object").AssertsShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
        ids: import("yup/lib/array").RequiredArraySchema<yup.StrapiIDSchema, import("yup/lib/types").AnyObject, any[] | undefined>;
    }>>>;
    validateRoleDeleteInput: (body: unknown, errorMessage?: string | undefined) => Promise<any>;
};
export default _default;
//# sourceMappingURL=role.d.ts.map