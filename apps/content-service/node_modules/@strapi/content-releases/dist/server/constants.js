'use strict';

const RELEASE_MODEL_UID = 'plugin::content-releases.release';
const RELEASE_ACTION_MODEL_UID = 'plugin::content-releases.release-action';
const ACTIONS = [
    {
        section: 'plugins',
        displayName: 'Read',
        uid: 'read',
        pluginName: 'content-releases'
    },
    {
        section: 'plugins',
        displayName: 'Create',
        uid: 'create',
        pluginName: 'content-releases'
    },
    {
        section: 'plugins',
        displayName: 'Edit',
        uid: 'update',
        pluginName: 'content-releases'
    },
    {
        section: 'plugins',
        displayName: 'Delete',
        uid: 'delete',
        pluginName: 'content-releases'
    },
    {
        section: 'plugins',
        displayName: 'Publish',
        uid: 'publish',
        pluginName: 'content-releases'
    },
    {
        section: 'plugins',
        displayName: 'Remove an entry from a release',
        uid: 'delete-action',
        pluginName: 'content-releases'
    },
    {
        section: 'plugins',
        displayName: 'Add an entry to a release',
        uid: 'create-action',
        pluginName: 'content-releases'
    },
    // Settings
    {
        uid: 'settings.read',
        section: 'settings',
        displayName: 'Read',
        category: 'content releases',
        subCategory: 'options',
        pluginName: 'content-releases'
    },
    {
        uid: 'settings.update',
        section: 'settings',
        displayName: 'Edit',
        category: 'content releases',
        subCategory: 'options',
        pluginName: 'content-releases'
    }
];
const ALLOWED_WEBHOOK_EVENTS = {
    RELEASES_PUBLISH: 'releases.publish'
};

exports.ACTIONS = ACTIONS;
exports.ALLOWED_WEBHOOK_EVENTS = ALLOWED_WEBHOOK_EVENTS;
exports.RELEASE_ACTION_MODEL_UID = RELEASE_ACTION_MODEL_UID;
exports.RELEASE_MODEL_UID = RELEASE_MODEL_UID;
//# sourceMappingURL=constants.js.map
