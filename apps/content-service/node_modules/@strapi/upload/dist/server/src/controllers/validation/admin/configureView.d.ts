import { yup } from '@strapi/utils';
declare const configSchema: import("yup/lib/object").OptionalObjectSchema<{
    pageSize: import("yup/lib/number").RequiredNumberSchema<number | undefined, Record<string, any>>;
    sort: import("yup/lib/mixed").MixedSchema<any, Record<string, any>, any>;
}, Record<string, any>, import("yup/lib/object").TypeOfShape<{
    pageSize: import("yup/lib/number").RequiredNumberSchema<number | undefined, Record<string, any>>;
    sort: import("yup/lib/mixed").MixedSchema<any, Record<string, any>, any>;
}>>;
export declare const validateViewConfiguration: (body: unknown, errorMessage?: string | undefined) => Promise<import("yup/lib/object").AssertsShape<{
    pageSize: import("yup/lib/number").RequiredNumberSchema<number | undefined, Record<string, any>>;
    sort: import("yup/lib/mixed").MixedSchema<any, Record<string, any>, any>;
}>>;
export type ViewConfiguration = yup.InferType<typeof configSchema>;
export {};
//# sourceMappingURL=configureView.d.ts.map