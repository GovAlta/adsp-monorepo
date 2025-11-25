import type { UID, Struct, Core } from '@strapi/types';
import type { ConfigurationUpdate } from './configuration';
declare const service: ({ strapi }: {
    strapi: Core.Strapi;
}) => {
    findAllContentTypes(): unknown[];
    findContentType(uid: UID.ContentType): any;
    findDisplayedContentTypes(): unknown[];
    findContentTypesByKind(kind: {
        kind: Struct.ContentTypeKind | undefined;
    }): unknown[];
    findConfiguration(contentType: Struct.ContentTypeSchema): Promise<any>;
    updateConfiguration(contentType: Struct.ContentTypeSchema, newConfiguration: ConfigurationUpdate): Promise<any>;
    findComponentsConfigurations(contentType: Struct.ContentTypeSchema): any;
    syncConfigurations(): Promise<void>;
};
export default service;
//# sourceMappingURL=content-types.d.ts.map