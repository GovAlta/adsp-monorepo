import { yup } from '@strapi/utils';
export declare const validateApiTokenCreationInput: (body: unknown, errorMessage?: string | undefined) => Promise<import("yup/lib/object").AssertsShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
    name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    description: import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
    type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    permissions: yup.ArraySchema<import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>, import("yup/lib/types").AnyObject, (string | undefined)[] | null | undefined, (string | undefined)[] | null | undefined>;
    lifespan: yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
}>>>;
export declare const validateApiTokenUpdateInput: (body: unknown, errorMessage?: string | undefined) => Promise<import("yup/lib/object").AssertsShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
    name: import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
    description: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
    type: import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
    permissions: yup.ArraySchema<import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>, import("yup/lib/types").AnyObject, (string | undefined)[] | null | undefined, (string | undefined)[] | null | undefined>;
}>>>;
declare const _default: {
    validateApiTokenCreationInput: (body: unknown, errorMessage?: string | undefined) => Promise<import("yup/lib/object").AssertsShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
        name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        description: import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
        type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        permissions: yup.ArraySchema<import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>, import("yup/lib/types").AnyObject, (string | undefined)[] | null | undefined, (string | undefined)[] | null | undefined>;
        lifespan: yup.NumberSchema<number | null | undefined, Record<string, any>, number | null | undefined>;
    }>>>;
    validateApiTokenUpdateInput: (body: unknown, errorMessage?: string | undefined) => Promise<import("yup/lib/object").AssertsShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
        name: import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
        description: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        type: import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
        permissions: yup.ArraySchema<import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>, import("yup/lib/types").AnyObject, (string | undefined)[] | null | undefined, (string | undefined)[] | null | undefined>;
    }>>>;
};
export default _default;
//# sourceMappingURL=api-tokens.d.ts.map