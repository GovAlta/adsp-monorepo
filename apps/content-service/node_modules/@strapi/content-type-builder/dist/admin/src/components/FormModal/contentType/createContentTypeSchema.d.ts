import * as yup from 'yup';
type CreateContentTypeSchemaParams = {
    usedContentTypeNames: Array<string>;
    reservedModels: Array<string>;
    singularNames: Array<string>;
    pluralNames: Array<string>;
    collectionNames: Array<string>;
};
export declare const createContentTypeSchema: ({ usedContentTypeNames, reservedModels, singularNames, pluralNames, collectionNames, }: CreateContentTypeSchemaParams) => import("yup/lib/object").OptionalObjectSchema<{
    displayName: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    pluralName: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    singularName: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    draftAndPublish: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
    kind: yup.default<string | undefined, Record<string, any>, string | undefined>;
}, Record<string, any>, import("yup/lib/object").TypeOfShape<{
    displayName: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    pluralName: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    singularName: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    draftAndPublish: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
    kind: yup.default<string | undefined, Record<string, any>, string | undefined>;
}>>;
export {};
