'use strict';

var icons = require('@strapi/icons');
var constants = require('./constants.js');
var Header = require('./routes/content-manager/model/id/components/Header.js');
var Panel = require('./routes/content-manager/model/id/components/Panel.js');
var cmHooks = require('./utils/cm-hooks.js');
var translations = require('./utils/translations.js');

function _interopNamespaceDefaultOnly (e) { return Object.freeze({ __proto__: null, default: e }); }

function __variableDynamicImportRuntime3__(path) {
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
const admin = {
    register (app) {
        if (window.strapi.features.isEnabled(constants.FEATURE_ID)) {
            app.registerHook('Admin/CM/pages/ListView/inject-column-in-table', cmHooks.addColumnToTableHook);
            const contentManagerPluginApis = app.getPlugin('content-manager').apis;
            if ('addEditViewSidePanel' in contentManagerPluginApis && typeof contentManagerPluginApis.addEditViewSidePanel === 'function') {
                contentManagerPluginApis.addEditViewSidePanel([
                    Panel.Panel
                ]);
            }
            app.addSettingsLink('global', {
                id: constants.PLUGIN_ID,
                to: `review-workflows`,
                intlLabel: {
                    id: `${constants.PLUGIN_ID}.plugin.name`,
                    defaultMessage: 'Review Workflows'
                },
                licenseOnly: true,
                permissions: [],
                async Component () {
                    const { Router } = await Promise.resolve().then(function () { return require('./router.js'); });
                    return {
                        default: Router
                    };
                }
            });
            // Always put the assigned to me widget last in the list of widgets
            app.widgets.register((widgets)=>[
                    ...widgets,
                    {
                        icon: icons.SealCheck,
                        title: {
                            id: `${constants.PLUGIN_ID}.widget.assigned.title`,
                            defaultMessage: 'Assigned to me'
                        },
                        component: async ()=>{
                            const { AssignedWidget } = await Promise.resolve().then(function () { return require('./components/Widgets.js'); });
                            return AssignedWidget;
                        },
                        pluginId: constants.PLUGIN_ID,
                        id: 'assigned',
                        permissions: [
                            {
                                action: 'plugin::content-manager.explorer.read'
                            }
                        ]
                    }
                ]);
        } else if (!window.strapi.features.isEnabled(constants.FEATURE_ID) && window.strapi?.flags?.promoteEE) {
            app.addSettingsLink('global', {
                id: constants.PLUGIN_ID,
                to: `purchase-review-workflows`,
                intlLabel: {
                    id: `${constants.PLUGIN_ID}.plugin.name`,
                    defaultMessage: 'Review Workflows'
                },
                licenseOnly: true,
                permissions: [],
                async Component () {
                    const { PurchaseReviewWorkflows } = await Promise.resolve().then(function () { return require('./routes/purchase-review-workflows.js'); });
                    return {
                        default: PurchaseReviewWorkflows
                    };
                }
            });
        }
    },
    bootstrap (app) {
        if (window.strapi.features.isEnabled(constants.FEATURE_ID)) {
            app.getPlugin('content-manager').injectComponent('preview', 'actions', {
                name: 'review-workflows-assignee',
                Component: Header.Header
            });
        }
    },
    async registerTrads ({ locales }) {
        const importedTrads = await Promise.all(locales.map((locale)=>{
            return __variableDynamicImportRuntime3__(`./translations/${locale}.json`).then(({ default: data })=>{
                return {
                    data: translations.prefixPluginTranslations(data, constants.PLUGIN_ID),
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
