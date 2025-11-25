'use strict';

var constants = require('./constants.js');
var index = require('./migrations/index.js');
var _5_0_0DocumentIdInActions = require('./migrations/database/5.0.0-document-id-in-actions.js');

const register = async ({ strapi })=>{
    if (strapi.ee.features.isEnabled('cms-content-releases')) {
        await strapi.service('admin::permission').actionProvider.registerMany(constants.ACTIONS);
        strapi.db.migrations.providers.internal.register(_5_0_0DocumentIdInActions.addEntryDocumentToReleaseActions);
        strapi.hook('strapi::content-types.beforeSync').register(index.disableContentTypeLocalized).register(index.deleteActionsOnDisableDraftAndPublish);
        strapi.hook('strapi::content-types.afterSync').register(index.deleteActionsOnDeleteContentType).register(index.enableContentTypeLocalized).register(index.revalidateChangedContentTypes).register(index.migrateIsValidAndStatusReleases);
    }
    if (strapi.plugin('graphql')) {
        const graphqlExtensionService = strapi.plugin('graphql').service('extension');
        // Exclude the release and release action models from the GraphQL schema
        graphqlExtensionService.shadowCRUD(constants.RELEASE_MODEL_UID).disable();
        graphqlExtensionService.shadowCRUD(constants.RELEASE_ACTION_MODEL_UID).disable();
    }
};

exports.register = register;
//# sourceMappingURL=register.js.map
