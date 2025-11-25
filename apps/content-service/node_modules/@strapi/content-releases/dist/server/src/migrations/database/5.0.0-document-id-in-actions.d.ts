import type { Migration } from '@strapi/database';
/**
 * On v4, release actions are linked with entries using the built in Polymorphic relations.
 *
 * On v5, we are going to save entryDocumentId on the release action and make the link manually.
 * This because entryId is not a reliable way to link documents, as it can change.
 */
export declare const addEntryDocumentToReleaseActions: Migration;
//# sourceMappingURL=5.0.0-document-id-in-actions.d.ts.map