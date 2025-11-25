'use strict';

var strapiUtils = require('@strapi/utils');
var fp = require('lodash/fp');
var components = require('./components.js');
var idTransform = require('./transform/id-transform.js');
var query = require('./transform/query.js');
var params = require('./params.js');
var index = require('./attributes/index.js');
var data = require('./transform/data.js');

const createEntriesService = (uid, entityValidator)=>{
    const contentType = strapi.contentType(uid);
    async function createEntry(params$1 = {}) {
        const { data, ...restParams } = await idTransform.transformParamsDocumentId(uid, params$1);
        const query$1 = query.transformParamsToQuery(uid, params.pickSelectionParams(restParams)); // select / populate
        // Validation
        if (!data) {
            throw new Error('Create requires data attribute');
        }
        // Check for uniqueness based on documentId and locale (if localized)
        if (data.documentId) {
            const i18nService = strapi.plugin('i18n')?.service('content-types');
            const isLocalized = i18nService?.isLocalizedContentType(contentType) ?? false;
            const hasDraftAndPublish = contentType.options?.draftAndPublish === true;
            const whereClause = {
                documentId: data.documentId
            };
            if (isLocalized) {
                whereClause.locale = data.locale;
            }
            let publishedStateDescription = '';
            if (hasDraftAndPublish) {
                if (data.publishedAt) {
                    // Current entry is published, check for existing published entry
                    whereClause.publishedAt = {
                        $notNull: true
                    };
                    publishedStateDescription = 'published';
                } else {
                    // Current entry is a draft, check for existing draft entry
                    whereClause.publishedAt = {
                        $null: true
                    };
                    publishedStateDescription = 'draft';
                }
            }
            const existingEntry = await strapi.db.query(uid).findOne({
                select: [
                    'id'
                ],
                where: whereClause
            });
            if (existingEntry) {
                let errorMsg = `A ${publishedStateDescription} entry with documentId "${data.documentId}"`;
                if (isLocalized && data.locale) {
                    errorMsg += ` and locale "${data.locale}"`;
                }
                errorMsg += ` already exists for UID "${uid}". This combination must be unique.`;
                throw new strapiUtils.errors.ApplicationError(errorMsg);
            }
        }
        const validData = await entityValidator.validateEntityCreation(contentType, data, {
            // Note: publishedAt value will always be set when DP is disabled
            isDraft: !params$1?.data?.publishedAt,
            locale: params$1?.locale
        });
        // Component handling
        const componentData = await components.createComponents(uid, validData);
        const dataWithComponents = components.assignComponentData(contentType, componentData, validData);
        const entryData = index.applyTransforms(contentType, dataWithComponents);
        const doc = await strapi.db.query(uid).create({
            ...query$1,
            data: entryData
        });
        return doc;
    }
    async function deleteEntry(id) {
        const componentsToDelete = await components.getComponents(uid, {
            id
        });
        const deletedEntry = await strapi.db.query(uid).delete({
            where: {
                id
            }
        });
        await components.deleteComponents(uid, componentsToDelete, {
            loadComponents: false
        });
        return deletedEntry;
    }
    async function updateEntry(entryToUpdate, params$1 = {}) {
        const { data, ...restParams } = await idTransform.transformParamsDocumentId(uid, params$1);
        const query$1 = query.transformParamsToQuery(uid, params.pickSelectionParams(restParams)); // select / populate
        const validData = await entityValidator.validateEntityUpdate(contentType, data, {
            isDraft: !params$1?.data?.publishedAt,
            locale: params$1?.locale
        }, entryToUpdate);
        // Component handling
        const componentData = await components.updateComponents(uid, entryToUpdate, validData);
        const dataWithComponents = components.assignComponentData(contentType, componentData, validData);
        const entryData = index.applyTransforms(contentType, dataWithComponents);
        return strapi.db.query(uid).update({
            ...query$1,
            where: {
                id: entryToUpdate.id
            },
            data: entryData
        });
    }
    async function publishEntry(entry, params = {}) {
        return strapiUtils.async.pipe(fp.omit('id'), fp.assoc('publishedAt', new Date()), (draft)=>{
            const opts = {
                uid,
                locale: draft.locale,
                status: 'published',
                allowMissingId: true
            };
            return data.transformData(draft, opts);
        }, // Create the published entry
        (draft)=>createEntry({
                ...params,
                data: draft,
                locale: draft.locale,
                status: 'published'
            }))(entry);
    }
    async function discardDraftEntry(entry, params = {}) {
        return strapiUtils.async.pipe(fp.omit('id'), fp.assoc('publishedAt', null), (entry)=>{
            const opts = {
                uid,
                locale: entry.locale,
                status: 'draft',
                allowMissingId: true
            };
            return data.transformData(entry, opts);
        }, // Create the draft entry
        (data)=>createEntry({
                ...params,
                locale: data.locale,
                data,
                status: 'draft'
            }))(entry);
    }
    return {
        create: createEntry,
        delete: deleteEntry,
        update: updateEntry,
        publish: publishEntry,
        discardDraft: discardDraftEntry
    };
};

exports.createEntriesService = createEntriesService;
//# sourceMappingURL=entries.js.map
