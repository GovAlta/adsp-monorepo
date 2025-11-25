 
import { yup } from '@strapi/utils';
import type { Struct, Internal, UID } from '@strapi/types';
export type CreateContentTypeInput = {
    uid?: UID.ContentType;
    contentType?: Partial<Struct.ContentTypeSchema> & Partial<Struct.ContentTypeSchemaInfo>;
    components?: Array<Partial<Struct.ComponentSchema> & Partial<Struct.SchemaInfo> & {
        tmpUID?: Internal.UID.Component;
    }>;
    singularName: Struct.ContentTypeSchemaInfo['singularName'];
    attributes: Struct.SchemaAttributes & Record<string, any>;
    kind: Struct.ContentTypeKind;
    collectionName?: Struct.CollectionTypeSchema['collectionName'];
    pluralName: Struct.ContentTypeSchemaInfo['pluralName'];
    displayName: Struct.ContentTypeSchemaInfo['displayName'];
    description?: Struct.ContentTypeSchemaInfo['description'];
    options?: Struct.SchemaOptions;
    draftAndPublish?: Struct.SchemaOptions['draftAndPublish'];
    pluginOptions?: Struct.ContentTypeSchema['pluginOptions'];
    config?: object;
};
/**
 * Validator for content type creation
 */
export declare const validateContentTypeInput: (data: CreateContentTypeInput) => Promise<import("yup/lib/object").AssertsShape<{
    contentType: any;
    components: yup.ArraySchema<any, import("yup/lib/types").AnyObject, any[] | undefined, any[] | undefined>;
}>>;
/**
 * Validator for content type edition
 */
export declare const validateUpdateContentTypeInput: (data: CreateContentTypeInput) => Promise<import("yup/lib/object").AssertsShape<{
    contentType: any;
    components: yup.ArraySchema<any, import("yup/lib/types").AnyObject, any[] | undefined, any[] | undefined>;
}>>;
export declare const validateKind: (body: unknown, errorMessage?: string | undefined) => Promise<string | undefined>;
//# sourceMappingURL=content-type.d.ts.map