'use strict';

var strapiUtils = require('@strapi/utils');
var dimensions = require('./validation/dimensions.js');
var index = require('../utils/index.js');
var metadata = require('./utils/metadata.js');

const buildPopulateFromQuery = async (query, model)=>{
    return index.getService('populate-builder')(model).populateFromQuery(query).populateDeep(Infinity).countRelations().build();
};
const findDocument = async (query, uid, opts = {})=>{
    const documentManager = index.getService('document-manager');
    const populate = await buildPopulateFromQuery(query, uid);
    return documentManager.findMany({
        ...opts,
        populate
    }, uid)// Return the first document found
    .then((documents)=>documents[0]);
};
const createOrUpdateDocument = async (ctx, opts)=>{
    const { user, userAbility } = ctx.state;
    const { model } = ctx.params;
    const { body, query } = ctx.request;
    const documentManager = index.getService('document-manager');
    const permissionChecker = index.getService('permission-checker').create({
        userAbility,
        model
    });
    if (permissionChecker.cannot.create() && permissionChecker.cannot.update()) {
        throw new strapiUtils.errors.ForbiddenError();
    }
    const sanitizedQuery = await permissionChecker.sanitizedQuery.update(query);
    const { locale } = await dimensions.getDocumentLocaleAndStatus(body, model);
    // Load document version to update
    const [documentVersion, otherDocumentVersion] = await Promise.all([
        findDocument(sanitizedQuery, model, {
            locale,
            status: 'draft'
        }),
        // Find the first document to check if it exists
        strapi.db.query(model).findOne({
            select: [
                'documentId'
            ]
        })
    ]);
    const documentId = otherDocumentVersion?.documentId;
    const pickPermittedFields = documentVersion ? permissionChecker.sanitizeUpdateInput(documentVersion) : permissionChecker.sanitizeCreateInput;
    const setCreator = documentVersion ? strapiUtils.setCreatorFields({
        user,
        isEdition: true
    }) : strapiUtils.setCreatorFields({
        user
    });
    const sanitizeFn = strapiUtils.async.pipe(pickPermittedFields, setCreator);
    // If version is not found, but document exists,
    // the intent is to create a new document locale
    if (documentVersion) {
        if (permissionChecker.cannot.update(documentVersion)) {
            throw new strapiUtils.errors.ForbiddenError();
        }
    } else if (permissionChecker.cannot.create()) {
        throw new strapiUtils.errors.ForbiddenError();
    }
    const sanitizedBody = await sanitizeFn(body);
    if (!documentId) {
        return documentManager.create(model, {
            data: sanitizedBody,
            ...sanitizedQuery,
            locale
        });
    }
    return documentManager.update(documentId, model, {
        data: sanitizedBody,
        populate: opts?.populate,
        locale
    });
};
var singleTypes = {
    async find (ctx) {
        const { userAbility } = ctx.state;
        const { model } = ctx.params;
        const { query = {} } = ctx.request;
        const permissionChecker = index.getService('permission-checker').create({
            userAbility,
            model
        });
        if (permissionChecker.cannot.read()) {
            return ctx.forbidden();
        }
        const permissionQuery = await permissionChecker.sanitizedQuery.read(query);
        const { locale, status } = await dimensions.getDocumentLocaleAndStatus(query, model);
        const version = await findDocument(permissionQuery, model, {
            locale,
            status
        });
        // allow user with create permission to know a single type is not created
        if (!version) {
            if (permissionChecker.cannot.create()) {
                return ctx.forbidden();
            }
            // Check if document exists
            const document = await strapi.db.query(model).findOne({});
            if (!document) {
                return ctx.notFound();
            }
            // If the requested locale doesn't exist, return an empty response
            const { meta } = await metadata.formatDocumentWithMetadata(permissionChecker, model, // @ts-expect-error - fix types
            {
                documentId: document.documentId,
                locale,
                publishedAt: null
            }, {
                availableLocales: true,
                availableStatus: false
            });
            ctx.body = {
                data: {},
                meta
            };
            return;
        }
        if (permissionChecker.cannot.read(version)) {
            return ctx.forbidden();
        }
        const sanitizedDocument = await permissionChecker.sanitizeOutput(version);
        ctx.body = await metadata.formatDocumentWithMetadata(permissionChecker, model, sanitizedDocument);
    },
    async createOrUpdate (ctx) {
        const { userAbility } = ctx.state;
        const { model } = ctx.params;
        const permissionChecker = index.getService('permission-checker').create({
            userAbility,
            model
        });
        const document = await createOrUpdateDocument(ctx);
        const sanitizedDocument = await permissionChecker.sanitizeOutput(document);
        ctx.body = await metadata.formatDocumentWithMetadata(permissionChecker, model, sanitizedDocument);
    },
    async delete (ctx) {
        const { userAbility } = ctx.state;
        const { model } = ctx.params;
        const { query = {} } = ctx.request;
        const documentManager = index.getService('document-manager');
        const permissionChecker = index.getService('permission-checker').create({
            userAbility,
            model
        });
        if (permissionChecker.cannot.delete()) {
            return ctx.forbidden();
        }
        const sanitizedQuery = await permissionChecker.sanitizedQuery.delete(query);
        const populate = await buildPopulateFromQuery(sanitizedQuery, model);
        const { locale } = await dimensions.getDocumentLocaleAndStatus(query, model);
        const documentLocales = await documentManager.findLocales(undefined, model, {
            populate,
            locale
        });
        if (documentLocales.length === 0) {
            return ctx.notFound();
        }
        for (const document of documentLocales){
            if (permissionChecker.cannot.delete(document)) {
                return ctx.forbidden();
            }
        }
        const deletedEntity = await documentManager.delete(documentLocales.at(0).documentId, model, {
            locale
        });
        ctx.body = await permissionChecker.sanitizeOutput(deletedEntity);
    },
    async publish (ctx) {
        const { userAbility } = ctx.state;
        const { model } = ctx.params;
        const { query = {} } = ctx.request;
        const documentManager = index.getService('document-manager');
        const permissionChecker = index.getService('permission-checker').create({
            userAbility,
            model
        });
        if (permissionChecker.cannot.publish()) {
            return ctx.forbidden();
        }
        const publishedDocument = await strapi.db.transaction(async ()=>{
            const sanitizedQuery = await permissionChecker.sanitizedQuery.publish(query);
            const populate = await buildPopulateFromQuery(sanitizedQuery, model);
            const document = await createOrUpdateDocument(ctx, {
                populate
            });
            if (!document) {
                throw new strapiUtils.errors.NotFoundError();
            }
            if (permissionChecker.cannot.publish(document)) {
                throw new strapiUtils.errors.ForbiddenError();
            }
            const { locale } = await dimensions.getDocumentLocaleAndStatus(document, model);
            const publishResult = await documentManager.publish(document.documentId, model, {
                locale
            });
            return publishResult.at(0);
        });
        const sanitizedDocument = await permissionChecker.sanitizeOutput(publishedDocument);
        ctx.body = await metadata.formatDocumentWithMetadata(permissionChecker, model, sanitizedDocument);
    },
    async unpublish (ctx) {
        const { userAbility } = ctx.state;
        const { model } = ctx.params;
        const { body: { discardDraft, ...body }, query = {} } = ctx.request;
        const documentManager = index.getService('document-manager');
        const permissionChecker = index.getService('permission-checker').create({
            userAbility,
            model
        });
        if (permissionChecker.cannot.unpublish()) {
            return ctx.forbidden();
        }
        if (discardDraft && permissionChecker.cannot.discard()) {
            return ctx.forbidden();
        }
        const sanitizedQuery = await permissionChecker.sanitizedQuery.unpublish(query);
        const { locale } = await dimensions.getDocumentLocaleAndStatus(body, model);
        const document = await findDocument(sanitizedQuery, model, {
            locale
        });
        if (!document) {
            return ctx.notFound();
        }
        if (permissionChecker.cannot.unpublish(document)) {
            return ctx.forbidden();
        }
        if (discardDraft && permissionChecker.cannot.discard(document)) {
            return ctx.forbidden();
        }
        await strapi.db.transaction(async ()=>{
            if (discardDraft) {
                await documentManager.discardDraft(document.documentId, model, {
                    locale
                });
            }
            ctx.body = await strapiUtils.async.pipe((document)=>documentManager.unpublish(document.documentId, model, {
                    locale
                }), permissionChecker.sanitizeOutput, (document)=>metadata.formatDocumentWithMetadata(permissionChecker, model, document))(document);
        });
    },
    async discard (ctx) {
        const { userAbility } = ctx.state;
        const { model } = ctx.params;
        const { body, query = {} } = ctx.request;
        const documentManager = index.getService('document-manager');
        const permissionChecker = index.getService('permission-checker').create({
            userAbility,
            model
        });
        if (permissionChecker.cannot.discard()) {
            return ctx.forbidden();
        }
        const sanitizedQuery = await permissionChecker.sanitizedQuery.discard(query);
        const { locale } = await dimensions.getDocumentLocaleAndStatus(body, model);
        const document = await findDocument(sanitizedQuery, model, {
            locale,
            status: 'published'
        });
        // Can not discard a document that is not published
        if (!document) {
            return ctx.notFound();
        }
        if (permissionChecker.cannot.discard(document)) {
            return ctx.forbidden();
        }
        ctx.body = await strapiUtils.async.pipe((document)=>documentManager.discardDraft(document.documentId, model, {
                locale
            }), permissionChecker.sanitizeOutput, (document)=>metadata.formatDocumentWithMetadata(permissionChecker, model, document))(document);
    },
    async countDraftRelations (ctx) {
        const { userAbility } = ctx.state;
        const { model } = ctx.params;
        const { query } = ctx.request;
        const documentManager = index.getService('document-manager');
        const permissionChecker = index.getService('permission-checker').create({
            userAbility,
            model
        });
        const { locale } = await dimensions.getDocumentLocaleAndStatus(query, model);
        if (permissionChecker.cannot.read()) {
            return ctx.forbidden();
        }
        const document = await findDocument({}, model);
        if (!document) {
            return ctx.notFound();
        }
        if (permissionChecker.cannot.read(document)) {
            return ctx.forbidden();
        }
        const number = await documentManager.countDraftRelations(document.documentId, model, locale);
        return {
            data: number
        };
    }
};

module.exports = singleTypes;
//# sourceMappingURL=single-types.js.map
