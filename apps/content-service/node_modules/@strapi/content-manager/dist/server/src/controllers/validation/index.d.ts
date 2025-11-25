import { UID } from '@strapi/types';
import { yup } from '@strapi/utils';
import createModelConfigurationSchema from './model-configuration';
declare const validateUIDField: (contentTypeUID: any, field: any) => void;
declare const validatePagination: ({ page, pageSize }: any) => void;
declare const validateKind: (body: unknown, errorMessage?: string | undefined) => Promise<string | null | undefined>;
declare const validateBulkActionInput: (body: unknown, errorMessage?: string | undefined) => Promise<import("yup/lib/object").AssertsShape<{
    documentIds: import("yup/lib/array").RequiredArraySchema<yup.StrapiIDSchema, import("yup/lib/types").AnyObject, any[] | undefined>;
}>>;
declare const validateGenerateUIDInput: (body: unknown, errorMessage?: string | undefined) => Promise<import("yup/lib/object").AssertsShape<{
    contentTypeUID: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    field: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    data: import("yup/lib/object").RequiredObjectSchema<import("yup/lib/object").ObjectShape, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").ObjectShape>>;
}>>;
declare const validateCheckUIDAvailabilityInput: (body: {
    contentTypeUID: UID.ContentType;
    field: string;
    value: string;
}) => Promise<import("yup/lib/object").AssertsShape<{
    contentTypeUID: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    field: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    value: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
}>>;
export { createModelConfigurationSchema, validateUIDField, validatePagination, validateKind, validateBulkActionInput, validateGenerateUIDInput, validateCheckUIDAvailabilityInput, };
//# sourceMappingURL=index.d.ts.map