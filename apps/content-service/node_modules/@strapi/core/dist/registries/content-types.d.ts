/// <reference types="lodash" />
import type { UID, Struct } from '@strapi/types';
import { ContentTypeDefinition } from '../domain/content-type';
type ContentTypesInput = Record<string, ContentTypeDefinition>;
type ContentTypeExtendFn = (contentType: Struct.ContentTypeSchema) => Struct.ContentTypeSchema;
declare const contentTypesRegistry: () => {
    /**
     * Returns this list of registered contentTypes uids
     */
    keys(): string[];
    /**
     * Returns the instance of a contentType. Instantiate the contentType if not already done
     */
    get(uid: UID.ContentType): Struct.ContentTypeSchema;
    /**
     * Returns a map with all the contentTypes in a namespace
     */
    getAll(namespace: string): import("lodash").Dictionary<unknown>;
    /**
     * Registers a contentType
     */
    set(uid: UID.ContentType, contentType: Struct.ContentTypeSchema): any;
    /**
     * Registers a map of contentTypes for a specific namespace
     */
    add(namespace: string, newContentTypes: ContentTypesInput): void;
    /**
     * Wraps a contentType to extend it
     */
    extend(ctUID: UID.ContentType, extendFn: ContentTypeExtendFn): any;
};
export default contentTypesRegistry;
//# sourceMappingURL=content-types.d.ts.map