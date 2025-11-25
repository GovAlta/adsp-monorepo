'use strict';

var constants = require('./constants.js');
var index = require('./utils/index.js');
var documents = require('./middlewares/documents.js');

const deleteReleasesActionsAndUpdateReleaseStatus = async (params)=>{
    const releases = await strapi.db.query(constants.RELEASE_MODEL_UID).findMany({
        where: {
            actions: params
        }
    });
    await strapi.db.query(constants.RELEASE_ACTION_MODEL_UID).deleteMany({
        where: params
    });
    // We update the status of each release after delete the actions
    for (const release of releases){
        index.getService('release', {
            strapi
        }).updateReleaseStatus(release.id);
    }
};
const bootstrap = async ({ strapi: strapi1 })=>{
    if (strapi1.ee.features.isEnabled('cms-content-releases')) {
        const contentTypesWithDraftAndPublish = Object.keys(strapi1.contentTypes).filter((uid)=>strapi1.contentTypes[uid]?.options?.draftAndPublish);
        strapi1.db.lifecycles.subscribe({
            models: contentTypesWithDraftAndPublish,
            /**
       * deleteMany is still used outside documents service, for example when deleting a locale
       */ async afterDeleteMany (event) {
                try {
                    const model = strapi1.getModel(event.model.uid);
                    // @ts-expect-error TODO: lifecycles types looks like are not 100% finished
                    if (model.kind === 'collectionType' && model.options?.draftAndPublish) {
                        const { where } = event.params;
                        deleteReleasesActionsAndUpdateReleaseStatus({
                            contentType: model.uid,
                            locale: where?.locale ?? null,
                            ...where?.documentId && {
                                entryDocumentId: where.documentId
                            }
                        });
                    }
                } catch (error) {
                    // If an error happens we don't want to block the delete entry flow, but we log the error
                    strapi1.log.error('Error while deleting release actions after entry deleteMany', {
                        error
                    });
                }
            }
        });
        // We register middleware to handle ReleaseActions when changes on documents are made
        strapi1.documents.use(documents.deleteActionsOnDelete);
        strapi1.documents.use(documents.updateActionsOnUpdate);
        index.getService('scheduling', {
            strapi: strapi1
        }).syncFromDatabase().catch((err)=>{
            strapi1.log.error('Error while syncing scheduled jobs from the database in the content-releases plugin. This could lead to errors in the releases scheduling.');
            throw err;
        });
        Object.entries(constants.ALLOWED_WEBHOOK_EVENTS).forEach(([key, value])=>{
            strapi1.get('webhookStore').addAllowedEvent(key, value);
        });
    }
};

exports.bootstrap = bootstrap;
//# sourceMappingURL=bootstrap.js.map
