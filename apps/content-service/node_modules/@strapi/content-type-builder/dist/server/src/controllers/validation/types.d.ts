import type { Schema, Struct } from '@strapi/types';
import { modelTypes } from '../../services/constants';
export type GetTypeValidatorOptions = {
    types: ReadonlyArray<string>;
    attributes?: Struct.SchemaAttributes;
    modelType?: (typeof modelTypes)[keyof typeof modelTypes];
};
export declare const getTypeValidator: (attribute: Schema.Attribute.AnyAttribute, { types, modelType, attributes }: GetTypeValidatorOptions) => import("yup/lib/object").OptionalObjectSchema<any, Record<string, any>, import("yup/lib/object").TypeOfShape<any>>;
//# sourceMappingURL=types.d.ts.map