import { yup } from '@strapi/utils';
declare const validateContentTypeDefinition: (data: unknown) => import("yup/lib/object").AssertsShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
    schema: import("yup").ObjectSchema<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
        info: any;
        attributes: import("yup/lib/object").OptionalObjectSchema<import("yup/lib/object").ObjectShape, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").ObjectShape>>;
    }>, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
        info: any;
        attributes: import("yup/lib/object").OptionalObjectSchema<import("yup/lib/object").ObjectShape, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").ObjectShape>>;
    }>>, import("yup/lib/object").AssertsShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
        info: any;
        attributes: import("yup/lib/object").OptionalObjectSchema<import("yup/lib/object").ObjectShape, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").ObjectShape>>;
    }>>>;
    actions: import("yup/lib/object").OptionalObjectSchema<import("yup/lib/object").ObjectShape, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").ObjectShape>>;
    lifecycles: import("yup").ObjectSchema<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
        [x: string]: import("yup/lib/mixed").MixedSchema<any, Record<string, any>, any>;
    }>, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
        [x: string]: import("yup/lib/mixed").MixedSchema<any, Record<string, any>, any>;
    }>>, import("yup/lib/object").AssertsShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
        [x: string]: import("yup/lib/mixed").MixedSchema<any, Record<string, any>, any>;
    }>>>;
}>>;
export { validateContentTypeDefinition };
//# sourceMappingURL=validator.d.ts.map