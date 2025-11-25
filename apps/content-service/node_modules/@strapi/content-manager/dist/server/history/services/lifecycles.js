'use strict';

var strapiUtils = require('@strapi/utils');
var fp = require('lodash/fp');
var utils$1 = require('../utils.js');
var constants = require('../constants.js');
var utils = require('./utils.js');

/**
 * Filters out actions that should not create a history version.
 */ const shouldCreateHistoryVersion = (context)=>{
    // Ignore requests that are not related to the content manager
    if (!strapi.requestContext.get()?.request.url.startsWith('/content-manager')) {
        return false;
    }
    // NOTE: cannot do type narrowing with array includes
    if (context.action !== 'create' && context.action !== 'update' && context.action !== 'clone' && context.action !== 'publish' && context.action !== 'unpublish' && context.action !== 'discardDraft') {
        return false;
    }
    /**
   * When a document is published, the draft version of the document is also updated.
   * It creates confusion for users because they see two history versions each publish action.
   * To avoid this, we silence the update action during a publish request,
   * so that they only see the published version of the document in the history.
   */ if (context.action === 'update' && strapi.requestContext.get()?.request.url.endsWith('/actions/publish')) {
        return false;
    }
    // Ignore content types not created by the user
    if (!context.contentType.uid.startsWith('api::')) {
        return false;
    }
    return true;
};
/**
 * Returns the content type schema (and its components schemas).
 * Used to determine if changes were made in the content type builder since a history version was created.
 * And therefore which fields can be restored and which cannot.
 */ const getSchemas = (uid)=>{
    const attributesSchema = strapi.getModel(uid).attributes;
    // TODO: Handle nested components
    const componentsSchemas = Object.keys(attributesSchema).reduce((currentComponentSchemas, key)=>{
        const fieldSchema = attributesSchema[key];
        if (fieldSchema.type === 'component') {
            const componentSchema = strapi.getModel(fieldSchema.component).attributes;
            return {
                ...currentComponentSchemas,
                [fieldSchema.component]: componentSchema
            };
        }
        // Ignore anything that's not a component
        return currentComponentSchemas;
    }, {});
    return {
        schema: fp.omit(constants.FIELDS_TO_IGNORE, attributesSchema),
        componentsSchemas
    };
};
const createLifecyclesService = ({ strapi: strapi1 })=>{
    const state = {
        isInitialized: false
    };
    const serviceUtils = utils.createServiceUtils({
        strapi: strapi1
    });
    const { persistTablesWithPrefix } = strapi1.service('admin::persist-tables');
    return {
        async bootstrap () {
            // Prevent initializing the service twice
            if (state.isInitialized) {
                return;
            }
            // Avoid data loss in case users temporarily don't have a license
            await persistTablesWithPrefix('strapi_history_versions');
            strapi1.documents.use(async (context, next)=>{
                const result = await next();
                if (!shouldCreateHistoryVersion(context)) {
                    return result;
                }
                // On create/clone actions, the documentId is not available before creating the action is executed
                const documentId = context.action === 'create' || context.action === 'clone' ? result.documentId : context.params.documentId;
                // Apply default locale if not available in the request
                const defaultLocale = await serviceUtils.getDefaultLocale();
                const locales = fp.castArray(context.params?.locale || defaultLocale);
                if (!locales.length) {
                    return result;
                }
                // All schemas related to the content type
                const uid = context.contentType.uid;
                const schemas = getSchemas(uid);
                const model = strapi1.getModel(uid);
                const isLocalizedContentType = serviceUtils.isLocalizedContentType(model);
                // Find all affected entries
                const localeEntries = await strapi1.db.query(uid).findMany({
                    where: {
                        documentId,
                        ...isLocalizedContentType ? {
                            locale: {
                                $in: locales
                            }
                        } : {},
                        ...strapiUtils.contentTypes.hasDraftAndPublish(strapi1.contentTypes[uid]) ? {
                            publishedAt: null
                        } : {}
                    },
                    populate: serviceUtils.getDeepPopulate(uid, true)
                });
                await strapi1.db.transaction(async ({ onCommit })=>{
                    // .createVersion() is executed asynchronously,
                    // onCommit prevents creating a history version
                    // when the transaction has already been committed
                    onCommit(async ()=>{
                        for (const entry of localeEntries){
                            const status = await serviceUtils.getVersionStatus(uid, entry);
                            await utils$1.getService(strapi1, 'history').createVersion({
                                contentType: uid,
                                data: fp.omit(constants.FIELDS_TO_IGNORE, entry),
                                relatedDocumentId: documentId,
                                locale: entry.locale,
                                status,
                                ...schemas
                            });
                        }
                    });
                });
                return result;
            });
            // Schedule a job to delete expired history versions every day at midnight
            strapi1.cron.add({
                deleteHistoryDaily: {
                    async task () {
                        const retentionDaysInMilliseconds = serviceUtils.getRetentionDays() * 24 * 60 * 60 * 1000;
                        const expirationDate = new Date(Date.now() - retentionDaysInMilliseconds);
                        strapi1.db.query(constants.HISTORY_VERSION_UID).deleteMany({
                            where: {
                                created_at: {
                                    $lt: expirationDate
                                }
                            }
                        }).catch((error)=>{
                            if (error instanceof Error) {
                                strapi1.log.error('Error deleting expired history versions', error.message);
                            }
                        });
                    },
                    options: '0 0 * * *'
                }
            });
            state.isInitialized = true;
        },
        async destroy () {
            strapi1.cron.remove('deleteHistoryDaily');
        }
    };
};

exports.createLifecyclesService = createLifecyclesService;
//# sourceMappingURL=lifecycles.js.map
