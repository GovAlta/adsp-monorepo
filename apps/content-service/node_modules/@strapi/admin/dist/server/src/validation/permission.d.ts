import { yup } from '@strapi/utils';
export declare const validatePermissionsExist: (body: unknown, errorMessage?: string | undefined) => Promise<import("yup/lib/object").AssertsShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
    conditions: yup.ArraySchema<import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>, import("yup/lib/types").AnyObject, (string | undefined)[] | undefined, (string | undefined)[] | undefined>;
}>>[] | undefined>;
export declare const validateCheckPermissionsInput: (body: unknown, errorMessage?: string | undefined) => Promise<import("yup/lib/object").AssertsShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
    permissions: yup.ArraySchema<import("yup").ObjectSchema<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
        action: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        subject: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        field: import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
    }>, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
        action: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        subject: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        field: import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
    }>>, import("yup/lib/object").AssertsShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
        action: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        subject: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        field: import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
    }>>>, import("yup/lib/types").AnyObject, import("yup/lib/object").TypeOfShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
        action: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        subject: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        field: import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
    }>>[] | undefined, import("yup/lib/object").AssertsShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
        action: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        subject: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        field: import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
    }>>[] | undefined>;
}>>>;
export declare const validatedUpdatePermissionsInput: (body: unknown, errorMessage?: string | undefined) => Promise<any>;
declare const _default: {
    validatedUpdatePermissionsInput: (body: unknown, errorMessage?: string | undefined) => Promise<any>;
    validatePermissionsExist: (body: unknown, errorMessage?: string | undefined) => Promise<import("yup/lib/object").AssertsShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
        conditions: yup.ArraySchema<import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>, import("yup/lib/types").AnyObject, (string | undefined)[] | undefined, (string | undefined)[] | undefined>;
    }>>[] | undefined>;
    validateCheckPermissionsInput: (body: unknown, errorMessage?: string | undefined) => Promise<import("yup/lib/object").AssertsShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
        permissions: yup.ArraySchema<import("yup").ObjectSchema<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
            action: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
            subject: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
            field: import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
        }>, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
            action: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
            subject: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
            field: import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
        }>>, import("yup/lib/object").AssertsShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
            action: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
            subject: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
            field: import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
        }>>>, import("yup/lib/types").AnyObject, import("yup/lib/object").TypeOfShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
            action: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
            subject: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
            field: import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
        }>>[] | undefined, import("yup/lib/object").AssertsShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
            action: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
            subject: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
            field: import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
        }>>[] | undefined>;
    }>>>;
};
export default _default;
//# sourceMappingURL=permission.d.ts.map