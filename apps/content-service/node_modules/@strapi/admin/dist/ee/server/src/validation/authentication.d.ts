import { yup } from '@strapi/utils';
export declare const validateProviderOptionsUpdate: (body: unknown, errorMessage?: string | undefined) => Promise<import("yup/lib/object").AssertsShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
    autoRegister: import("yup/lib/boolean").RequiredBooleanSchema<boolean | undefined, Record<string, any>>;
    defaultRole: yup.StrapiIDSchema;
    ssoLockedRoles: yup.ArraySchema<yup.StrapiIDSchema, import("yup/lib/types").AnyObject, any[] | undefined, any[] | undefined>;
}>>>;
declare const _default: {
    validateProviderOptionsUpdate: (body: unknown, errorMessage?: string | undefined) => Promise<import("yup/lib/object").AssertsShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
        autoRegister: import("yup/lib/boolean").RequiredBooleanSchema<boolean | undefined, Record<string, any>>;
        defaultRole: yup.StrapiIDSchema;
        ssoLockedRoles: yup.ArraySchema<yup.StrapiIDSchema, import("yup/lib/types").AnyObject, any[] | undefined, any[] | undefined>;
    }>>>;
};
export default _default;
//# sourceMappingURL=authentication.d.ts.map