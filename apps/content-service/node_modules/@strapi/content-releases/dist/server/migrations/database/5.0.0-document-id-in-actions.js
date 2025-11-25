'use strict';

var utils = require('@strapi/utils');

/**
 * On v4, release actions are linked with entries using the built in Polymorphic relations.
 *
 * On v5, we are going to save entryDocumentId on the release action and make the link manually.
 * This because entryId is not a reliable way to link documents, as it can change.
 */ const addEntryDocumentToReleaseActions = {
    name: 'content-releases::5.0.0-add-entry-document-id-to-release-actions',
    async up (trx, db) {
        // Check if the table exists
        const hasTable = await trx.schema.hasTable('strapi_release_actions');
        if (!hasTable) {
            return;
        }
        const hasPolymorphicColumn = await trx.schema.hasColumn('strapi_release_actions', 'target_id');
        // If user has PolymorphicColumn means that is coming from v4
        if (hasPolymorphicColumn) {
            // First time coming from v4 user doesn't have entryDocumentId
            // but we double check to avoid errors
            const hasEntryDocumentIdColumn = await trx.schema.hasColumn('strapi_release_actions', 'entry_document_id');
            if (!hasEntryDocumentIdColumn) {
                await trx.schema.alterTable('strapi_release_actions', (table)=>{
                    table.string('entry_document_id');
                });
            }
            const releaseActions = await trx.select('*').from('strapi_release_actions');
            utils.async.map(releaseActions, async (action)=>{
                const { target_type, target_id } = action;
                const entry = await db.query(target_type).findOne({
                    where: {
                        id: target_id
                    }
                });
                if (entry) {
                    await trx('strapi_release_actions').update({
                        entry_document_id: entry.documentId
                    }).where('id', action.id);
                }
            });
        }
    },
    async down () {
        throw new Error('not implemented');
    }
};

exports.addEntryDocumentToReleaseActions = addEntryDocumentToReleaseActions;
//# sourceMappingURL=5.0.0-document-id-in-actions.js.map
