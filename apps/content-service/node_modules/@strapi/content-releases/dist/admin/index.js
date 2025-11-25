'use strict';

var icons = require('@strapi/icons');
var ReleaseAction = require('./components/ReleaseAction.js');
var ReleaseActionModal = require('./components/ReleaseActionModal.js');
var ReleaseListCell = require('./components/ReleaseListCell.js');
var ReleasesPanel = require('./components/ReleasesPanel.js');
var constants = require('./constants.js');
var pluginId = require('./pluginId.js');
var prefixPluginTranslations = require('./utils/prefixPluginTranslations.js');

function _interopNamespaceDefaultOnly (e) { return Object.freeze({ __proto__: null, default: e }); }

function __variableDynamicImportRuntime4__(path) {
  switch (path) {
    case './translations/en.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/en.json.js')); });
    case './translations/uk.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/uk.json.js')); });
    default: return new Promise(function(resolve, reject) {
      (typeof queueMicrotask === 'function' ? queueMicrotask : setTimeout)(
        reject.bind(null, new Error("Unknown variable dynamic import: " + path))
      );
    })
   }
 }
// eslint-disable-next-line import/no-default-export
const admin = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    register (app) {
        /**
     * Hook that adds the locale column in the Release Details table
     * @constant
     * @type {string}
     */ app.createHook('ContentReleases/pages/ReleaseDetails/add-locale-in-releases');
        if (window.strapi.features.isEnabled('cms-content-releases')) {
            app.addMenuLink({
                to: `plugins/${pluginId.pluginId}`,
                icon: icons.PaperPlane,
                intlLabel: {
                    id: `${pluginId.pluginId}.plugin.name`,
                    defaultMessage: 'Releases'
                },
                Component: ()=>Promise.resolve().then(function () { return require('./pages/App.js'); }).then((mod)=>({
                            default: mod.App
                        })),
                permissions: constants.PERMISSIONS.main,
                position: 2
            });
            // Insert the releases container into the CM's sidebar on the Edit View
            const contentManagerPluginApis = app.getPlugin('content-manager').apis;
            if ('addEditViewSidePanel' in contentManagerPluginApis && typeof contentManagerPluginApis.addEditViewSidePanel === 'function') {
                contentManagerPluginApis.addEditViewSidePanel([
                    ReleasesPanel.Panel
                ]);
            }
            // Insert the "add to release" action into the CM's Edit View
            if ('addDocumentAction' in contentManagerPluginApis && typeof contentManagerPluginApis.addDocumentAction === 'function') {
                contentManagerPluginApis.addDocumentAction((actions)=>{
                    const indexOfDeleteAction = actions.findIndex((action)=>action.type === 'unpublish');
                    actions.splice(indexOfDeleteAction, 0, ReleaseActionModal.ReleaseActionModalForm);
                    return actions;
                });
            }
            app.addSettingsLink('global', {
                id: pluginId.pluginId,
                to: 'releases',
                intlLabel: {
                    id: `${pluginId.pluginId}.plugin.name`,
                    defaultMessage: 'Releases'
                },
                licenseOnly: true,
                permissions: [],
                async Component () {
                    const { ProtectedReleasesSettingsPage } = await Promise.resolve().then(function () { return require('./pages/ReleasesSettingsPage.js'); });
                    return {
                        default: ProtectedReleasesSettingsPage
                    };
                }
            });
            if ('addBulkAction' in contentManagerPluginApis && typeof contentManagerPluginApis.addBulkAction === 'function') {
                contentManagerPluginApis.addBulkAction((actions)=>{
                    // We want to add this action to just before the delete action all the time
                    const deleteActionIndex = actions.findIndex((action)=>action.type === 'delete');
                    actions.splice(deleteActionIndex, 0, ReleaseAction.ReleaseAction);
                    return actions;
                });
            }
            // Hook that adds a column into the CM's LV table
            app.registerHook('Admin/CM/pages/ListView/inject-column-in-table', ReleaseListCell.addColumnToTableHook);
            app.widgets.register([
                {
                    icon: icons.PaperPlane,
                    title: {
                        id: `${constants.PLUGIN_ID}.widget.upcoming-releases.title`,
                        defaultMessage: 'Upcoming releases'
                    },
                    component: async ()=>{
                        const { UpcomingReleasesWidget } = await Promise.resolve().then(function () { return require('./components/Widgets.js'); });
                        return UpcomingReleasesWidget;
                    },
                    pluginId: constants.PLUGIN_ID,
                    id: 'upcoming-releases',
                    link: {
                        label: {
                            id: `${constants.PLUGIN_ID}.widget.upcoming-releases.link`,
                            defaultMessage: 'Open Releases'
                        },
                        href: '/plugins/content-releases'
                    }
                }
            ]);
        } else if (!window.strapi.features.isEnabled('cms-content-releases') && window.strapi?.flags?.promoteEE) {
            app.addSettingsLink('global', {
                id: pluginId.pluginId,
                to: '/plugins/purchase-content-releases',
                intlLabel: {
                    id: `${pluginId.pluginId}.plugin.name`,
                    defaultMessage: 'Releases'
                },
                permissions: [],
                async Component () {
                    const { PurchaseContentReleases } = await Promise.resolve().then(function () { return require('./pages/PurchaseContentReleases.js'); });
                    return {
                        default: PurchaseContentReleases
                    };
                },
                licenseOnly: true
            });
        }
    },
    async registerTrads ({ locales }) {
        const importedTrads = await Promise.all(locales.map((locale)=>{
            return __variableDynamicImportRuntime4__(`./translations/${locale}.json`).then(({ default: data })=>{
                return {
                    data: prefixPluginTranslations.prefixPluginTranslations(data, 'content-releases'),
                    locale
                };
            }).catch(()=>{
                return {
                    data: {},
                    locale
                };
            });
        }));
        return Promise.resolve(importedTrads);
    }
};

module.exports = admin;
//# sourceMappingURL=index.js.map
