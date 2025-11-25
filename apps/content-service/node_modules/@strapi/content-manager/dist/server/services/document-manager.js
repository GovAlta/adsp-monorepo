'use strict';

var fp = require('lodash/fp');
var strapiUtils = require('@strapi/utils');
var populate = require('./utils/populate.js');
var draft = require('./utils/draft.js');

const { ApplicationError } = strapiUtils.errors;
const { PUBLISHED_AT_ATTRIBUTE } = strapiUtils.contentTypes.constants;
const omitPublishedAtField = fp.omit(PUBLISHED_AT_ATTRIBUTE);
const omitIdField = fp.omit('id');
const documentManager = ({ strapi })=>{
    return {
        async findOne (id, uid, opts = {}) {
            return strapi.documents(uid).findOne({
                ...opts,
                documentId: id
            });
        },
        /**
     * Find multiple (or all) locales for a document
     */ async findLocales (id, uid, opts) {
            // Will look for a specific locale by default
            const where = {};
            // Might not have an id if querying a single type
            if (id) {
                where.documentId = id;
            }
            // Search in array of locales
            if (Array.isArray(opts.locale)) {
                where.locale = {
                    $in: opts.locale
                };
            } else if (opts.locale && opts.locale !== '*') {
                // Look for a specific locale, ignore if looking for all locales
                where.locale = opts.locale;
            }
            // Published is passed, so we filter on it, otherwise we don't filter
            if (typeof opts.isPublished === 'boolean') {
                where.publishedAt = {
                    $notNull: opts.isPublished
                };
            }
            return strapi.db.query(uid).findMany({
                populate: opts.populate,
                where
            });
        },
        async findMany (opts, uid) {
            const params = {
                ...opts,
                populate: populate.getDeepPopulate(uid)
            };
            return strapi.documents(uid).findMany(params);
        },
        async findPage (opts, uid) {
            const params = strapiUtils.pagination.withDefaultPagination(opts || {}, {
                maxLimit: 1000
            });
            const [documents, total = 0] = await Promise.all([
                strapi.documents(uid).findMany(params),
                strapi.documents(uid).count(params)
            ]);
            return {
                results: documents,
                pagination: strapiUtils.pagination.transformPagedPaginationInfo(params, total)
            };
        },
        async create (uid, opts = {}) {
            const populate$1 = opts.populate ?? await populate.buildDeepPopulate(uid);
            const params = {
                ...opts,
                status: 'draft',
                populate: populate$1
            };
            return strapi.documents(uid).create(params);
        },
        async update (id, uid, opts = {}) {
            const publishData = fp.pipe(omitPublishedAtField, omitIdField)(opts.data || {});
            const populate$1 = opts.populate ?? await populate.buildDeepPopulate(uid);
            const params = {
                ...opts,
                data: publishData,
                populate: populate$1,
                status: 'draft'
            };
            return strapi.documents(uid).update({
                ...params,
                documentId: id
            });
        },
        async clone (id, body, uid) {
            const populate$1 = await populate.buildDeepPopulate(uid);
            // Extract the locale to pass it as a plain param
            const locale = body?.locale;
            const params = {
                // Ensure id and documentId are not copied to the clone
                data: fp.omit([
                    'id',
                    'documentId'
                ], body),
                locale,
                populate: populate$1
            };
            return strapi.documents(uid).clone({
                ...params,
                documentId: id
            }).then((result)=>result?.entries.at(0));
        },
        /**
     *  Check if a document exists
     */ async exists (uid, id) {
            // Collection type
            if (id) {
                const count = await strapi.db.query(uid).count({
                    where: {
                        documentId: id
                    }
                });
                return count > 0;
            }
            // Single type
            const count = await strapi.db.query(uid).count();
            return count > 0;
        },
        async delete (id, uid, opts = {}) {
            const populate$1 = await populate.buildDeepPopulate(uid);
            await strapi.documents(uid).delete({
                ...opts,
                documentId: id,
                populate: populate$1
            });
            return {};
        },
        // FIXME: handle relations
        async deleteMany (documentIds, uid, opts = {}) {
            const deletedEntries = await strapi.db.transaction(async ()=>{
                return Promise.all(documentIds.map(async (id)=>this.delete(id, uid, opts)));
            });
            return {
                count: deletedEntries.length
            };
        },
        async publish (id, uid, opts = {}) {
            const populate$1 = await populate.buildDeepPopulate(uid);
            const params = {
                ...opts,
                populate: populate$1
            };
            return strapi.documents(uid).publish({
                ...params,
                documentId: id
            }).then((result)=>result?.entries);
        },
        async publishMany (uid, documentIds, locale) {
            return strapi.db.transaction(async ()=>{
                const results = await Promise.all(documentIds.map((documentId)=>this.publish(documentId, uid, {
                        locale
                    })));
                const publishedEntitiesCount = results.flat().filter(Boolean).length;
                return publishedEntitiesCount;
            });
        },
        async unpublishMany (documentIds, uid, opts = {}) {
            const unpublishedEntries = await strapi.db.transaction(async ()=>{
                return Promise.all(documentIds.map((id)=>strapi.documents(uid).unpublish({
                        ...opts,
                        documentId: id
                    }).then((result)=>result?.entries)));
            });
            const unpublishedEntitiesCount = unpublishedEntries.flat().filter(Boolean).length;
            // Return the number of unpublished entities
            return {
                count: unpublishedEntitiesCount
            };
        },
        async unpublish (id, uid, opts = {}) {
            const populate$1 = await populate.buildDeepPopulate(uid);
            const params = {
                ...opts,
                populate: populate$1
            };
            return strapi.documents(uid).unpublish({
                ...params,
                documentId: id
            }).then((result)=>result?.entries.at(0));
        },
        async discardDraft (id, uid, opts = {}) {
            const populate$1 = await populate.buildDeepPopulate(uid);
            const params = {
                ...opts,
                populate: populate$1
            };
            return strapi.documents(uid).discardDraft({
                ...params,
                documentId: id
            }).then((result)=>result?.entries.at(0));
        },
        async countDraftRelations (id, uid, locale) {
            const { populate: populate$1, hasRelations } = populate.getDeepPopulateDraftCount(uid);
            if (!hasRelations) {
                return 0;
            }
            const document = await strapi.documents(uid).findOne({
                documentId: id,
                populate: populate$1,
                locale
            });
            if (!document) {
                throw new ApplicationError(`Unable to count draft relations, document with id ${id} and locale ${locale} not found`);
            }
            return draft.sumDraftCounts(document, uid);
        },
        async countManyEntriesDraftRelations (documentIds, uid, locale) {
            const { populate: populate$1, hasRelations } = populate.getDeepPopulateDraftCount(uid);
            if (!hasRelations) {
                return 0;
            }
            let localeFilter = {};
            if (locale) {
                localeFilter = Array.isArray(locale) ? {
                    locale: {
                        $in: locale
                    }
                } : {
                    locale
                };
            }
            const entities = await strapi.db.query(uid).findMany({
                populate: populate$1,
                where: {
                    documentId: {
                        $in: documentIds
                    },
                    ...localeFilter
                }
            });
            const totalNumberDraftRelations = entities.reduce((count, entity)=>draft.sumDraftCounts(entity, uid) + count, 0);
            return totalNumberDraftRelations;
        }
    };
};

module.exports = documentManager;
//# sourceMappingURL=document-manager.js.map
