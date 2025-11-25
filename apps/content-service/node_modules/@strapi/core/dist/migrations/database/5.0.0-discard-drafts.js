'use strict';

var strapiUtils = require('@strapi/utils');
var index = require('../../services/document-service/index.js');

/**
 * Check if the model has draft and publish enabled.
 */ const hasDraftAndPublish = async (trx, meta)=>{
    const hasTable = await trx.schema.hasTable(meta.tableName);
    if (!hasTable) {
        return false;
    }
    const uid = meta.uid;
    const model = strapi.getModel(uid);
    const hasDP = strapiUtils.contentTypes.hasDraftAndPublish(model);
    if (!hasDP) {
        return false;
    }
    return true;
};
/**
 * Copy all the published entries to draft entries, without it's components, dynamic zones or relations.
 * This ensures all necessary draft's exist before copying it's relations.
 */ async function copyPublishedEntriesToDraft({ db, trx, uid }) {
    // Extract all scalar attributes to use in the insert query
    const meta = db.metadata.get(uid);
    // Get scalar attributes that will be copied over the new draft
    const scalarAttributes = Object.values(meta.attributes).reduce((acc, attribute)=>{
        if ([
            'id'
        ].includes(attribute.columnName)) {
            return acc;
        }
        if (strapiUtils.contentTypes.isScalarAttribute(attribute)) {
            acc.push(attribute.columnName);
        }
        return acc;
    }, []);
    /**
   * Query to copy the published entries into draft entries.
   *
   * INSERT INTO tableName (columnName1, columnName2, columnName3, ...)
   * SELECT columnName1, columnName2, columnName3, ...
   * FROM tableName
   */ await trx// INSERT INTO tableName (columnName1, columnName2, columnName3, ...)
    .into(trx.raw(`?? (${scalarAttributes.map(()=>`??`).join(', ')})`, [
        meta.tableName,
        ...scalarAttributes
    ])).insert((subQb)=>{
        // SELECT columnName1, columnName2, columnName3, ...
        subQb.select(...scalarAttributes.map((att)=>{
            // Override 'publishedAt' and 'updatedAt' attributes
            if (att === 'published_at') {
                return trx.raw('NULL as ??', 'published_at');
            }
            return att;
        })).from(meta.tableName)// Only select entries that were published
        .whereNotNull('published_at');
    });
}
/**
 * Load a batch of versions to discard.
 *
 * Versions with only a draft version will be ignored.
 * Only versions with a published version (which always have a draft version) will be discarded.
 */ async function* getBatchToDiscard({ db, trx, uid, defaultBatchSize = 1000 }) {
    const client = db.config.connection.client;
    const isSQLite = typeof client === 'string' && [
        'sqlite',
        'sqlite3',
        'better-sqlite3'
    ].includes(client);
    // The SQLite documentation states that the maximum number of terms in a
    // compound SELECT statement is 500 by default.
    // See: https://www.sqlite.org/limits.html
    // To ensure a successful migration, we limit the batch size to 500 for SQLite.
    const batchSize = isSQLite ? Math.min(defaultBatchSize, 500) : defaultBatchSize;
    let offset = 0;
    let hasMore = true;
    while(hasMore){
        // Look for the published entries to discard
        const batch = await db.queryBuilder(uid).select([
            'id',
            'documentId',
            'locale'
        ]).where({
            publishedAt: {
                $ne: null
            }
        }).limit(batchSize).offset(offset).orderBy('id').transacting(trx).execute();
        if (batch.length < batchSize) {
            hasMore = false;
        }
        offset += batchSize;
        yield batch;
    }
}
/**
 * 2 pass migration to create the draft entries for all the published entries.
 * And then discard the drafts to copy the relations.
 */ const migrateUp = async (trx, db)=>{
    const dpModels = [];
    for (const meta of db.metadata.values()){
        const hasDP = await hasDraftAndPublish(trx, meta);
        if (hasDP) {
            dpModels.push(meta);
        }
    }
    /**
   * Create plain draft entries for all the entries that were published.
   */ for (const model of dpModels){
        await copyPublishedEntriesToDraft({
            db,
            trx,
            uid: model.uid
        });
    }
    /**
   * Discard the drafts will copy the relations from the published entries to the newly created drafts.
   *
   * Load a batch of entries (batched to prevent loading millions of rows at once ),
   * and discard them using the document service.
   *
   * NOTE: This is using a custom document service without any validations,
   *       to prevent the migration from failing if users already had invalid data in V4.
   *       E.g. @see https://github.com/strapi/strapi/issues/21583
   */ const documentService = index.createDocumentService(strapi, {
        async validateEntityCreation (_, data) {
            return data;
        },
        async validateEntityUpdate (_, data) {
            // Data can be partially empty on partial updates
            // This migration doesn't trigger any update (or partial update),
            // so it's safe to return the data as is.
            return data;
        }
    });
    for (const model of dpModels){
        const discardDraft = async (entry)=>documentService(model.uid).discardDraft({
                documentId: entry.documentId,
                locale: entry.locale
            });
        for await (const batch of getBatchToDiscard({
            db,
            trx,
            uid: model.uid
        })){
            // NOTE: concurrency had to be disabled to prevent a race condition with self-references
            // TODO: improve performance in a safe way
            await strapiUtils.async.map(batch, discardDraft, {
                concurrency: 1
            });
        }
    }
};
const discardDocumentDrafts = {
    name: 'core::5.0.0-discard-drafts',
    async up (trx, db) {
        await migrateUp(trx, db);
    },
    async down () {
        throw new Error('not implemented');
    }
};

exports.discardDocumentDrafts = discardDocumentDrafts;
exports.getBatchToDiscard = getBatchToDiscard;
//# sourceMappingURL=5.0.0-discard-drafts.js.map
