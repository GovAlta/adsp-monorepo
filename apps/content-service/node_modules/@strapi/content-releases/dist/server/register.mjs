import { ACTIONS, RELEASE_MODEL_UID, RELEASE_ACTION_MODEL_UID } from './constants.mjs';
import { disableContentTypeLocalized, deleteActionsOnDisableDraftAndPublish, deleteActionsOnDeleteContentType, enableContentTypeLocalized, revalidateChangedContentTypes, migrateIsValidAndStatusReleases } from './migrations/index.mjs';
import { addEntryDocumentToReleaseActions } from './migrations/database/5.0.0-document-id-in-actions.mjs';

const register = async ({ strapi })=>{
    if (strapi.ee.features.isEnabled('cms-content-releases')) {
        await strapi.service('admin::permission').actionProvider.registerMany(ACTIONS);
        strapi.db.migrations.providers.internal.register(addEntryDocumentToReleaseActions);
        strapi.hook('strapi::content-types.beforeSync').register(disableContentTypeLocalized).register(deleteActionsOnDisableDraftAndPublish);
        strapi.hook('strapi::content-types.afterSync').register(deleteActionsOnDeleteContentType).register(enableContentTypeLocalized).register(revalidateChangedContentTypes).register(migrateIsValidAndStatusReleases);
    }
    if (strapi.plugin('graphql')) {
        const graphqlExtensionService = strapi.plugin('graphql').service('extension');
        // Exclude the release and release action models from the GraphQL schema
        graphqlExtensionService.shadowCRUD(RELEASE_MODEL_UID).disable();
        graphqlExtensionService.shadowCRUD(RELEASE_ACTION_MODEL_UID).disable();
    }
};

export { register };
//# sourceMappingURL=register.mjs.map
