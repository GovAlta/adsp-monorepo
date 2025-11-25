import type { Schema } from '@strapi/types';
interface Input {
    oldContentTypes: Record<string, Schema.ContentType>;
    contentTypes: Record<string, Schema.ContentType>;
}
export declare function deleteActionsOnDisableDraftAndPublish({ oldContentTypes, contentTypes, }: Input): Promise<void>;
export declare function deleteActionsOnDeleteContentType({ oldContentTypes, contentTypes }: Input): Promise<void>;
export declare function migrateIsValidAndStatusReleases(): Promise<void>;
export declare function revalidateChangedContentTypes({ oldContentTypes, contentTypes }: Input): Promise<void>;
export declare function disableContentTypeLocalized({ oldContentTypes, contentTypes }: Input): Promise<void>;
export declare function enableContentTypeLocalized({ oldContentTypes, contentTypes }: Input): Promise<void>;
export {};
//# sourceMappingURL=index.d.ts.map