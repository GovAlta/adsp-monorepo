/**
 * This migration is responsible for creating the draft counterpart for all the entries that were in a published state.
 *
 * In v4, entries could either be in a draft or published state, but not both at the same time.
 * In v5, we introduced the concept of document, and an entry can be in a draft or published state.
 *
 * This means the migration needs to create the draft counterpart if an entry was published.
 *
 * This migration performs the following steps:
 * 1. Creates draft entries for all published entries, without it's components, dynamic zones or relations.
 * 2. Using the document service, discard those same drafts to copy its relations.
 */
import type { Database, Migration } from '@strapi/database';
type DocumentVersion = {
    documentId: string;
    locale: string;
};
type Knex = Parameters<Migration['up']>[0];
/**
 * Load a batch of versions to discard.
 *
 * Versions with only a draft version will be ignored.
 * Only versions with a published version (which always have a draft version) will be discarded.
 */
export declare function getBatchToDiscard({ db, trx, uid, defaultBatchSize, }: {
    db: Database;
    trx: Knex;
    uid: string;
    defaultBatchSize?: number;
}): AsyncGenerator<DocumentVersion[], void, unknown>;
export declare const discardDocumentDrafts: Migration;
export {};
//# sourceMappingURL=5.0.0-discard-drafts.d.ts.map