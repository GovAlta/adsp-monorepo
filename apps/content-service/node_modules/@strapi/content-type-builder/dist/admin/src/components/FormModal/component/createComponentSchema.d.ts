import * as yup from 'yup';
export declare const createComponentSchema: (usedComponentNames: Array<string>, reservedNames: Array<string>, category: string, takenCollectionNames: Array<string>, currentCollectionName: string) => import("yup/lib/object").OptionalObjectSchema<{
    displayName: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    category: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    icon: yup.default<string | undefined, Record<string, any>, string | undefined>;
}, Record<string, any>, import("yup/lib/object").TypeOfShape<{
    displayName: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    category: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    icon: yup.default<string | undefined, Record<string, any>, string | undefined>;
}>>;
