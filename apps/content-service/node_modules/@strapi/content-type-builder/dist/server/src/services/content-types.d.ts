import type { UID, Struct } from '@strapi/types';
export declare const isContentTypeVisible: (model: Struct.ContentTypeSchema) => boolean;
export declare const getRestrictRelationsTo: (contentType: Struct.ContentTypeSchema) => string[] | null;
/**
 * Format a contentType info to be used by the front-end
 */
export declare const formatContentType: (contentType: any) => {
    uid: any;
    plugin: any;
    apiID: any;
    schema: {
        displayName: any;
        singularName: any;
        pluralName: any;
        description: any;
        pluginOptions: any;
        kind: any;
        collectionName: any;
        attributes: any;
        visible: boolean;
        restrictRelationsTo: string[] | null;
        draftAndPublish: boolean;
    } | {
        displayName: any;
        singularName: any;
        pluralName: any;
        description: any;
        pluginOptions: any;
        kind: any;
        collectionName: any;
        attributes: any;
        visible: boolean;
        restrictRelationsTo: string[] | null;
        draftAndPublish: boolean;
        populateCreatorFields?: boolean | undefined;
    };
};
export declare const createContentTypes: (contentTypes: any[]) => Promise<any[]>;
type CreateContentTypeOptions = {
    defaultBuilder?: any;
};
/**
 * Creates a content type and handle the nested components sent with it
 */
export declare const createContentType: ({ contentType, components }: any, options?: CreateContentTypeOptions) => Promise<any>;
/**
 * Generate an API skeleton
 */
export declare const generateAPI: ({ singularName, kind, pluralName, displayName, }: any) => any;
/**
 * Edits a contentType and handle the nested contentTypes sent with it
 */
export declare const editContentType: (uid: UID.ContentType, { contentType, components }: any) => Promise<any>;
export declare const deleteContentTypes: (uids: UID.ContentType[]) => Promise<void>;
/**
 * Deletes a content type and the api files related to it
 */
export declare const deleteContentType: (uid: UID.ContentType, defaultBuilder?: any) => Promise<any>;
export {};
//# sourceMappingURL=content-types.d.ts.map