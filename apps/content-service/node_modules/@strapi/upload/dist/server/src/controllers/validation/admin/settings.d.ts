import { yup } from '@strapi/utils';
declare const settingsSchema: import("yup/lib/object").OptionalObjectSchema<{
    sizeOptimization: import("yup/lib/boolean").RequiredBooleanSchema<boolean | undefined, Record<string, any>>;
    responsiveDimensions: import("yup/lib/boolean").RequiredBooleanSchema<boolean | undefined, Record<string, any>>;
    autoOrientation: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
    aiMetadata: yup.BooleanSchema<boolean, Record<string, any>, boolean>;
}, Record<string, any>, import("yup/lib/object").TypeOfShape<{
    sizeOptimization: import("yup/lib/boolean").RequiredBooleanSchema<boolean | undefined, Record<string, any>>;
    responsiveDimensions: import("yup/lib/boolean").RequiredBooleanSchema<boolean | undefined, Record<string, any>>;
    autoOrientation: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
    aiMetadata: yup.BooleanSchema<boolean, Record<string, any>, boolean>;
}>>;
declare const _default: (body: unknown, errorMessage?: string | undefined) => Promise<import("yup/lib/object").AssertsShape<{
    sizeOptimization: import("yup/lib/boolean").RequiredBooleanSchema<boolean | undefined, Record<string, any>>;
    responsiveDimensions: import("yup/lib/boolean").RequiredBooleanSchema<boolean | undefined, Record<string, any>>;
    autoOrientation: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
    aiMetadata: yup.BooleanSchema<boolean, Record<string, any>, boolean>;
}>>;
export default _default;
export type Settings = yup.InferType<typeof settingsSchema>;
//# sourceMappingURL=settings.d.ts.map