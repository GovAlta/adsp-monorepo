import * as yup from 'yup';
export declare const schema: yup.default<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
    name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    description: yup.default<string | null | undefined, Record<string, any>, string | null | undefined>;
    lifespan: import("yup/lib/number").DefinedNumberSchema<number | null | undefined, Record<string, any>>;
}>, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
    name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    description: yup.default<string | null | undefined, Record<string, any>, string | null | undefined>;
    lifespan: import("yup/lib/number").DefinedNumberSchema<number | null | undefined, Record<string, any>>;
}>>, import("yup/lib/object").AssertsShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
    name: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    description: yup.default<string | null | undefined, Record<string, any>, string | null | undefined>;
    lifespan: import("yup/lib/number").DefinedNumberSchema<number | null | undefined, Record<string, any>>;
}>>>;
