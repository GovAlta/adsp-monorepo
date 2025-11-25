import { yup } from '@strapi/utils';
declare const uploadSchema: import("yup/lib/object").OptionalObjectSchema<{
    fileInfo: import("yup/lib/object").OptionalObjectSchema<{
        name: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        alternativeText: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        caption: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
    }, Record<string, any>, import("yup/lib/object").TypeOfShape<{
        name: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        alternativeText: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        caption: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
    }>>;
}, Record<string, any>, import("yup/lib/object").TypeOfShape<{
    fileInfo: import("yup/lib/object").OptionalObjectSchema<{
        name: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        alternativeText: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        caption: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
    }, Record<string, any>, import("yup/lib/object").TypeOfShape<{
        name: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        alternativeText: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        caption: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
    }>>;
}>>;
declare const multiUploadSchema: import("yup/lib/object").OptionalObjectSchema<{
    fileInfo: yup.ArraySchema<import("yup/lib/object").OptionalObjectSchema<{
        name: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        alternativeText: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        caption: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
    }, Record<string, any>, import("yup/lib/object").TypeOfShape<{
        name: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        alternativeText: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        caption: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
    }>>, import("yup/lib/types").AnyObject, import("yup/lib/object").TypeOfShape<{
        name: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        alternativeText: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        caption: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
    }>[] | undefined, import("yup/lib/object").AssertsShape<{
        name: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        alternativeText: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        caption: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
    }>[] | undefined>;
}, Record<string, any>, import("yup/lib/object").TypeOfShape<{
    fileInfo: yup.ArraySchema<import("yup/lib/object").OptionalObjectSchema<{
        name: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        alternativeText: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        caption: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
    }, Record<string, any>, import("yup/lib/object").TypeOfShape<{
        name: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        alternativeText: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        caption: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
    }>>, import("yup/lib/types").AnyObject, import("yup/lib/object").TypeOfShape<{
        name: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        alternativeText: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        caption: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
    }>[] | undefined, import("yup/lib/object").AssertsShape<{
        name: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        alternativeText: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        caption: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
    }>[] | undefined>;
}>>;
declare const validateUploadBody: (data?: {}, isMulti?: boolean) => Promise<import("yup/lib/object").AssertsShape<{
    fileInfo: import("yup/lib/object").OptionalObjectSchema<{
        name: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        alternativeText: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        caption: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
    }, Record<string, any>, import("yup/lib/object").TypeOfShape<{
        name: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        alternativeText: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        caption: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
    }>>;
}> | import("yup/lib/object").AssertsShape<{
    fileInfo: yup.ArraySchema<import("yup/lib/object").OptionalObjectSchema<{
        name: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        alternativeText: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        caption: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
    }, Record<string, any>, import("yup/lib/object").TypeOfShape<{
        name: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        alternativeText: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        caption: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
    }>>, import("yup/lib/types").AnyObject, import("yup/lib/object").TypeOfShape<{
        name: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        alternativeText: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        caption: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
    }>[] | undefined, import("yup/lib/object").AssertsShape<{
        name: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        alternativeText: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
        caption: import("yup").StringSchema<string | null | undefined, Record<string, any>, string | null | undefined>;
    }>[] | undefined>;
}>>;
export { validateUploadBody };
export type UploadBody = yup.InferType<typeof uploadSchema> | yup.InferType<typeof multiUploadSchema>;
//# sourceMappingURL=upload.d.ts.map