import { yup } from '@strapi/utils';
declare const validateModule: (data: unknown) => import("yup/lib/object").AssertsShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
    bootstrap: import("yup/lib/mixed").MixedSchema<any, Record<string, any>, any>;
    destroy: import("yup/lib/mixed").MixedSchema<any, Record<string, any>, any>;
    register: import("yup/lib/mixed").MixedSchema<any, Record<string, any>, any>;
    config: import("yup/lib/object").OptionalObjectSchema<import("yup/lib/object").ObjectShape, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").ObjectShape>>;
    routes: import("yup/lib/Lazy").default<import("yup/lib/object").OptionalObjectSchema<import("yup/lib/object").ObjectShape, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").ObjectShape>> | import("yup/lib/array").OptionalArraySchema<yup.AnySchema, import("yup/lib/types").AnyObject, any[] | undefined>, any>;
    controllers: import("yup/lib/object").OptionalObjectSchema<import("yup/lib/object").ObjectShape, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").ObjectShape>>;
    services: import("yup/lib/object").OptionalObjectSchema<import("yup/lib/object").ObjectShape, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").ObjectShape>>;
    policies: import("yup/lib/object").OptionalObjectSchema<import("yup/lib/object").ObjectShape, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").ObjectShape>>;
    middlewares: import("yup/lib/object").OptionalObjectSchema<import("yup/lib/object").ObjectShape, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").ObjectShape>>;
    contentTypes: import("yup/lib/object").OptionalObjectSchema<import("yup/lib/object").ObjectShape, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").ObjectShape>>;
}>>;
export { validateModule };
//# sourceMappingURL=validation.d.ts.map