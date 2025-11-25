import { yup } from '@strapi/utils';
/**
 * Creates the validation schema for content-type configurations
 */
declare const _default: (schema: any, opts?: {}) => import("yup").ObjectSchema<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
    settings: any;
    metadatas: any;
    layouts: any;
    options: import("yup/lib/object").OptionalObjectSchema<import("yup/lib/object").ObjectShape, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").ObjectShape>>;
}>, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
    settings: any;
    metadatas: any;
    layouts: any;
    options: import("yup/lib/object").OptionalObjectSchema<import("yup/lib/object").ObjectShape, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").ObjectShape>>;
}>>, import("yup/lib/object").AssertsShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
    settings: any;
    metadatas: any;
    layouts: any;
    options: import("yup/lib/object").OptionalObjectSchema<import("yup/lib/object").ObjectShape, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").ObjectShape>>;
}>>>;
export default _default;
//# sourceMappingURL=model-configuration.d.ts.map