'use strict';

var fp = require('lodash/fp');
var index = require('../../utils/index.js');

const actions = [
    {
        section: 'settings',
        category: 'Internationalization',
        subCategory: 'Locales',
        pluginName: 'i18n',
        displayName: 'Create',
        uid: 'locale.create'
    },
    {
        section: 'settings',
        category: 'Internationalization',
        subCategory: 'Locales',
        pluginName: 'i18n',
        displayName: 'Read',
        uid: 'locale.read',
        aliases: [
            {
                actionId: 'plugin::content-manager.explorer.read',
                subjects: [
                    'plugin::i18n.locale'
                ]
            }
        ]
    },
    {
        section: 'settings',
        category: 'Internationalization',
        subCategory: 'Locales',
        pluginName: 'i18n',
        displayName: 'Update',
        uid: 'locale.update'
    },
    {
        section: 'settings',
        category: 'Internationalization',
        subCategory: 'Locales',
        pluginName: 'i18n',
        displayName: 'Delete',
        uid: 'locale.delete'
    }
];
const addLocalesPropertyIfNeeded = ({ value: action })=>{
    const { section, options: { applyToProperties } } = action;
    // Only add the locales property to contentTypes' actions
    if (section !== 'contentTypes') {
        return;
    }
    // If the 'locales' property is already declared within the applyToProperties array, then ignore the next steps
    if (fp.isArray(applyToProperties) && applyToProperties.includes('locales')) {
        return;
    }
    // Add the 'locales' property to the applyToProperties array (create it if necessary)
    action.options.applyToProperties = fp.isArray(applyToProperties) ? applyToProperties.concat('locales') : [
        'locales'
    ];
};
const shouldApplyLocalesPropertyToSubject = ({ property, subject })=>{
    if (property === 'locales') {
        const model = strapi.getModel(subject);
        return index.getService('content-types').isLocalizedContentType(model);
    }
    return true;
};
const addAllLocalesToPermissions = async (permissions)=>{
    const { actionProvider } = strapi.service('admin::permission');
    const { find: findAllLocales } = index.getService('locales');
    const allLocales = await findAllLocales();
    const allLocalesCode = allLocales.map(fp.prop('code'));
    return Promise.all(permissions.map(async (permission)=>{
        const { action, subject } = permission;
        const appliesToLocalesProperty = await actionProvider.appliesToProperty('locales', action, subject);
        if (!appliesToLocalesProperty) {
            return permission;
        }
        const oldPermissionProperties = fp.getOr({}, 'properties', permission);
        return {
            ...permission,
            properties: {
                ...oldPermissionProperties,
                locales: allLocalesCode
            }
        };
    }));
};
const syncSuperAdminPermissionsWithLocales = async ()=>{
    const roleService = strapi.service('admin::role');
    const permissionService = strapi.service('admin::permission');
    const superAdminRole = await roleService.getSuperAdmin();
    if (!superAdminRole) {
        return;
    }
    const superAdminPermissions = await permissionService.findMany({
        where: {
            role: {
                id: superAdminRole.id
            }
        }
    });
    const newSuperAdminPermissions = await addAllLocalesToPermissions(superAdminPermissions);
    await roleService.assignPermissions(superAdminRole.id, newSuperAdminPermissions);
};
const registerI18nActions = async ()=>{
    const { actionProvider } = strapi.service('admin::permission');
    await actionProvider.registerMany(actions);
};
const registerI18nActionsHooks = ()=>{
    const { actionProvider } = strapi.service('admin::permission');
    const { hooks } = strapi.service('admin::role');
    actionProvider.hooks.appliesPropertyToSubject.register(shouldApplyLocalesPropertyToSubject);
    hooks.willResetSuperAdminPermissions.register(addAllLocalesToPermissions);
};
const updateActionsProperties = ()=>{
    const { actionProvider } = strapi.service('admin::permission');
    // Register the transformation for every new action
    actionProvider.hooks.willRegister.register(addLocalesPropertyIfNeeded);
    // Handle already registered actions
    actionProvider.values().forEach((action)=>addLocalesPropertyIfNeeded({
            value: action
        }));
};
var i18nActionsService = {
    actions,
    registerI18nActions,
    registerI18nActionsHooks,
    updateActionsProperties,
    syncSuperAdminPermissionsWithLocales
};

module.exports = i18nActionsService;
//# sourceMappingURL=actions.js.map
