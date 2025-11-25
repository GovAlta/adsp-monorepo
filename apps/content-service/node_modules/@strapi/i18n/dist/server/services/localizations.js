'use strict';

var fp = require('lodash/fp');
var utils = require('@strapi/utils');
var index = require('../utils/index.js');

/**
 * Update non localized fields of all the related localizations of an entry with the entry values
 */ const syncNonLocalizedAttributes = async (sourceEntry, model)=>{
    const { copyNonLocalizedAttributes } = index.getService('content-types');
    const nonLocalizedAttributes = copyNonLocalizedAttributes(model, sourceEntry);
    if (fp.isEmpty(nonLocalizedAttributes)) {
        return;
    }
    const uid = model.uid;
    const documentId = sourceEntry.documentId;
    const locale = sourceEntry.locale;
    const status = sourceEntry?.publishedAt ? 'published' : 'draft';
    // Find all the entries that need to be updated
    // this is every other entry of the document in the same status but a different locale
    const localeEntriesToUpdate = await strapi.db.query(uid).findMany({
        where: {
            documentId,
            publishedAt: status === 'published' ? {
                $ne: null
            } : null,
            locale: {
                $ne: locale
            }
        },
        select: [
            'locale',
            'id'
        ]
    });
    const entryData = await strapi.documents(uid).omitComponentData(nonLocalizedAttributes);
    await utils.async.map(localeEntriesToUpdate, async (entry)=>{
        const transformedData = await strapi.documents.utils.transformData(fp.cloneDeep(nonLocalizedAttributes), {
            uid,
            status,
            locale: entry.locale,
            allowMissingId: true
        });
        // Update or create non localized components for the entry
        const componentData = await strapi.documents(uid).updateComponents(entry, transformedData);
        // Update every other locale entry of this documentId in the same status
        await strapi.db.query(uid).update({
            where: {
                documentId,
                publishedAt: status === 'published' ? {
                    $ne: null
                } : null,
                locale: {
                    $eq: entry.locale
                }
            },
            // The data we send to the update function is the entry data merged with
            // the updated component data
            data: Object.assign(fp.cloneDeep(entryData), componentData)
        });
    });
};
const localizations = ()=>({
        syncNonLocalizedAttributes
    });

module.exports = localizations;
//# sourceMappingURL=localizations.js.map
