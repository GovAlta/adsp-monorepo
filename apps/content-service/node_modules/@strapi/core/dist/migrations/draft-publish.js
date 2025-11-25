'use strict';

var strapiUtils = require('@strapi/utils');
var _5_0_0DiscardDrafts = require('./database/5.0.0-discard-drafts.js');

/**
 * Enable draft and publish for content types.
 *
 * Draft and publish disabled content types will have their entries published,
 * this migration clones those entries as drafts.
 *
 * TODO: Clone components, dynamic zones and relations
 */ const enableDraftAndPublish = async ({ oldContentTypes, contentTypes })=>{
    if (!oldContentTypes) {
        return;
    }
    // run the after content types migrations
    return strapi.db.transaction(async (trx)=>{
        for(const uid in contentTypes){
            if (!oldContentTypes[uid]) {
                continue;
            }
            const oldContentType = oldContentTypes[uid];
            const contentType = contentTypes[uid];
            // if d&p was enabled set publishedAt to eq createdAt
            if (!strapiUtils.contentTypes.hasDraftAndPublish(oldContentType) && strapiUtils.contentTypes.hasDraftAndPublish(contentType)) {
                const discardDraft = async (entry)=>strapi.documents(uid)// Discard draft by referencing the documentId and locale
                    .discardDraft({
                        documentId: entry.documentId,
                        locale: entry.locale
                    });
                /**
         * Load a batch of entries (batched to prevent loading millions of rows at once ),
         * and discard them using the document service.
         */ for await (const batch of _5_0_0DiscardDrafts.getBatchToDiscard({
                    db: strapi.db,
                    trx,
                    uid
                })){
                    await strapiUtils.async.map(batch, discardDraft, {
                        concurrency: 10
                    });
                }
            }
        }
    });
};
const disableDraftAndPublish = async ({ oldContentTypes, contentTypes })=>{
    if (!oldContentTypes) {
        return;
    }
    for(const uid in contentTypes){
        if (!oldContentTypes[uid]) {
            continue;
        }
        const oldContentType = oldContentTypes[uid];
        const contentType = contentTypes[uid];
        // if d&p was disabled remove unpublish content before sync
        if (strapiUtils.contentTypes.hasDraftAndPublish(oldContentType) && !strapiUtils.contentTypes.hasDraftAndPublish(contentType)) {
            await strapi.db?.queryBuilder(uid).delete().where({
                published_at: null
            }).execute();
        }
    }
};

exports.disable = disableDraftAndPublish;
exports.enable = enableDraftAndPublish;
//# sourceMappingURL=draft-publish.js.map
