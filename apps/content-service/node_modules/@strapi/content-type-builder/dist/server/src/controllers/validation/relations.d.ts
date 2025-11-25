import { yup } from '@strapi/utils';
import type { Schema } from '@strapi/types';
export declare const getRelationValidator: (attribute: Schema.Attribute.Relation, allowedRelations: ReadonlyArray<string>) => import("yup/lib/object").OptionalObjectSchema<{
    type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    relation: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    configurable: yup.BooleanSchema<boolean | null | undefined, import("yup/lib/types").AnyObject, boolean | null | undefined>;
    private: yup.BooleanSchema<boolean | null | undefined, import("yup/lib/types").AnyObject, boolean | null | undefined>;
    pluginOptions: import("yup/lib/object").OptionalObjectSchema<import("yup/lib/object").ObjectShape, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").ObjectShape>>;
}, Record<string, any>, import("yup/lib/object").TypeOfShape<{
    type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    relation: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    configurable: yup.BooleanSchema<boolean | null | undefined, import("yup/lib/types").AnyObject, boolean | null | undefined>;
    private: yup.BooleanSchema<boolean | null | undefined, import("yup/lib/types").AnyObject, boolean | null | undefined>;
    pluginOptions: import("yup/lib/object").OptionalObjectSchema<import("yup/lib/object").ObjectShape, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").ObjectShape>>;
}>>;
//# sourceMappingURL=relations.d.ts.map