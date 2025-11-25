import { modelTypes } from '../../services/constants';
type ModelTypeInput = (typeof modelTypes)[keyof typeof modelTypes];
type CreateAttributesInput = {
    types: ReadonlyArray<string>;
    relations: ReadonlyArray<string>;
    modelType?: ModelTypeInput;
};
export declare const createSchema: (types: CreateAttributesInput['types'], relations: CreateAttributesInput['relations'], { modelType }?: {
    modelType?: ModelTypeInput;
}) => import("yup/lib/object").OptionalObjectSchema<any, Record<string, any>, import("yup/lib/object").TypeOfShape<any>>;
export {};
//# sourceMappingURL=model-schema.d.ts.map