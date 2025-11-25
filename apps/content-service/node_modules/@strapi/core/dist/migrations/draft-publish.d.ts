import type { Schema } from '@strapi/types';
export interface Input {
    oldContentTypes: Record<string, Schema.ContentType>;
    contentTypes: Record<string, Schema.ContentType>;
}
/**
 * Enable draft and publish for content types.
 *
 * Draft and publish disabled content types will have their entries published,
 * this migration clones those entries as drafts.
 *
 * TODO: Clone components, dynamic zones and relations
 */
declare const enableDraftAndPublish: ({ oldContentTypes, contentTypes }: Input) => Promise<void>;
declare const disableDraftAndPublish: ({ oldContentTypes, contentTypes }: Input) => Promise<void>;
export { enableDraftAndPublish as enable, disableDraftAndPublish as disable };
//# sourceMappingURL=draft-publish.d.ts.map