import { yup } from '@strapi/utils';
export declare const validateReleaseAction: (body: unknown, errorMessage?: string | undefined) => Promise<import("yup/lib/object").AssertsShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
    contentType: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    entryDocumentId: yup.StrapiIDSchema;
    locale: import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
    type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
}>>>;
export declare const validateReleaseActionUpdateSchema: (body: unknown, errorMessage?: string | undefined) => Promise<import("yup/lib/object").AssertsShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
    type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
}>>>;
export declare const validateFindManyActionsParams: (body: unknown, errorMessage?: string | undefined) => Promise<import("yup/lib/object").AssertsShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
    groupBy: import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
}>>>;
//# sourceMappingURL=release-action.d.ts.map