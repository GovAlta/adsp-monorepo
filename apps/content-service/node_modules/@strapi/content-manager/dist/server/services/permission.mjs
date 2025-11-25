import { prop } from 'lodash/fp';
import { contentTypes } from '@strapi/utils';
import { getService } from '../utils/index.mjs';

var permission = (({ strapi })=>({
        canConfigureContentType ({ userAbility, contentType }) {
            const action = contentTypes.isSingleType(contentType) ? 'plugin::content-manager.single-types.configure-view' : 'plugin::content-manager.collection-types.configure-view';
            return userAbility.can(action);
        },
        async registerPermissions () {
            const displayedContentTypes = getService('content-types').findDisplayedContentTypes();
            const contentTypesUids = displayedContentTypes.map(prop('uid'));
            const actions = [
                {
                    section: 'contentTypes',
                    displayName: 'Create',
                    uid: 'explorer.create',
                    pluginName: 'content-manager',
                    subjects: contentTypesUids,
                    options: {
                        applyToProperties: [
                            'fields'
                        ]
                    }
                },
                {
                    section: 'contentTypes',
                    displayName: 'Read',
                    uid: 'explorer.read',
                    pluginName: 'content-manager',
                    subjects: contentTypesUids,
                    options: {
                        applyToProperties: [
                            'fields'
                        ]
                    }
                },
                {
                    section: 'contentTypes',
                    displayName: 'Update',
                    uid: 'explorer.update',
                    pluginName: 'content-manager',
                    subjects: contentTypesUids,
                    options: {
                        applyToProperties: [
                            'fields'
                        ]
                    }
                },
                {
                    section: 'contentTypes',
                    displayName: 'Delete',
                    uid: 'explorer.delete',
                    pluginName: 'content-manager',
                    subjects: contentTypesUids
                },
                {
                    section: 'contentTypes',
                    displayName: 'Publish',
                    uid: 'explorer.publish',
                    pluginName: 'content-manager',
                    subjects: contentTypesUids
                },
                {
                    section: 'plugins',
                    displayName: 'Configure view',
                    uid: 'single-types.configure-view',
                    subCategory: 'single types',
                    pluginName: 'content-manager'
                },
                {
                    section: 'plugins',
                    displayName: 'Configure view',
                    uid: 'collection-types.configure-view',
                    subCategory: 'collection types',
                    pluginName: 'content-manager'
                },
                {
                    section: 'plugins',
                    displayName: 'Configure Layout',
                    uid: 'components.configure-layout',
                    subCategory: 'components',
                    pluginName: 'content-manager'
                }
            ];
            await strapi.service('admin::permission').actionProvider.registerMany(actions);
        }
    }));

export { permission as default };
//# sourceMappingURL=permission.mjs.map
