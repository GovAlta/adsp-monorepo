import { ALLOWED_WEBHOOK_EVENTS, RELEASE_MODEL_UID, RELEASE_ACTION_MODEL_UID } from './constants.mjs';
import { getService } from './utils/index.mjs';
import { deleteActionsOnDelete, updateActionsOnUpdate } from './middlewares/documents.mjs';

const deleteReleasesActionsAndUpdateReleaseStatus = async (params)=>{
    const releases = await strapi.db.query(RELEASE_MODEL_UID).findMany({
        where: {
            actions: params
        }
    });
    await strapi.db.query(RELEASE_ACTION_MODEL_UID).deleteMany({
        where: params
    });
    // We update the status of each release after delete the actions
    for (const release of releases){
        getService('release', {
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
        strapi1.documents.use(deleteActionsOnDelete);
        strapi1.documents.use(updateActionsOnUpdate);
        getService('scheduling', {
            strapi: strapi1
        }).syncFromDatabase().catch((err)=>{
            strapi1.log.error('Error while syncing scheduled jobs from the database in the content-releases plugin. This could lead to errors in the releases scheduling.');
            throw err;
        });
        Object.entries(ALLOWED_WEBHOOK_EVENTS).forEach(([key, value])=>{
            strapi1.get('webhookStore').addAllowedEvent(key, value);
        });
    }
};

export { bootstrap };
//# sourceMappingURL=bootstrap.mjs.map
