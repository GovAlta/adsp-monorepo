import { yup } from '@strapi/utils';
declare const validateCreateLocaleInput: (body: unknown, errorMessage?: string | undefined) => Promise<import("yup/lib/object").AssertsShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
    name: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
    code: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    isDefault: import("yup/lib/boolean").RequiredBooleanSchema<boolean | undefined, Record<string, any>>;
}>>>;
declare const validateUpdateLocaleInput: (body: unknown, errorMessage?: string | undefined) => Promise<import("yup/lib/object").AssertsShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
    name: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
    isDefault: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
}>>>;
export { validateCreateLocaleInput, validateUpdateLocaleInput };
//# sourceMappingURL=locales.d.ts.map