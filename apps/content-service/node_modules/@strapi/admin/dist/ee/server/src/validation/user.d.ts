import { yup } from '@strapi/utils';
export declare const validateUserCreationInput: (data: any) => Promise<import("yup/lib/object").AssertsShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
    email: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    firstname: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    lastname: import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
    roles: import("yup/lib/array").OptionalArraySchema<yup.StrapiIDSchema, import("yup/lib/types").AnyObject, any[] | undefined>;
    preferedLanguage: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
}>>>;
declare const _default: {
    validateUserCreationInput: (data: any) => Promise<import("yup/lib/object").AssertsShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
        email: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        firstname: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
        lastname: import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
        roles: import("yup/lib/array").OptionalArraySchema<yup.StrapiIDSchema, import("yup/lib/types").AnyObject, any[] | undefined>;
        preferedLanguage: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
    }>>>;
};
export default _default;
//# sourceMappingURL=user.d.ts.map