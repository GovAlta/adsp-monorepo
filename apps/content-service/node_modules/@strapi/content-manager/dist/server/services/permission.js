'use strict';

var fp = require('lodash/fp');
var strapiUtils = require('@strapi/utils');
var index = require('../utils/index.js');

var permission = (({ strapi })=>({
        canConfigureContentType ({ userAbility, contentType }) {
            const action = strapiUtils.contentTypes.isSingleType(contentType) ? 'plugin::content-manager.single-types.configure-view' : 'plugin::content-manager.collection-types.configure-view';
            return userAbility.can(action);
        },
        async registerPermissions () {
            const displayedContentTypes = index.getService('content-types').findDisplayedContentTypes();
            const contentTypesUids = displayedContentTypes.map(fp.prop('uid'));
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

module.exports = permission;
//# sourceMappingURL=permission.js.map
