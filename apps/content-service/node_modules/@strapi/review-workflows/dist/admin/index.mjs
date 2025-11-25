import { SealCheck } from '@strapi/icons';
import { FEATURE_ID, PLUGIN_ID } from './constants.mjs';
import { Header } from './routes/content-manager/model/id/components/Header.mjs';
import { Panel } from './routes/content-manager/model/id/components/Panel.mjs';
import { addColumnToTableHook } from './utils/cm-hooks.mjs';
import { prefixPluginTranslations } from './utils/translations.mjs';

function __variableDynamicImportRuntime3__(path) {
  switch (path) {
    case './translations/en.json': return import('./translations/en.json.mjs');
    case './translations/uk.json': return import('./translations/uk.json.mjs');
    default: return new Promise(function(resolve, reject) {
      (typeof queueMicrotask === 'function' ? queueMicrotask : setTimeout)(
        reject.bind(null, new Error("Unknown variable dynamic import: " + path))
      );
    })
   }
 }
const admin = {
    register (app) {
        if (window.strapi.features.isEnabled(FEATURE_ID)) {
            app.registerHook('Admin/CM/pages/ListView/inject-column-in-table', addColumnToTableHook);
            const contentManagerPluginApis = app.getPlugin('content-manager').apis;
            if ('addEditViewSidePanel' in contentManagerPluginApis && typeof contentManagerPluginApis.addEditViewSidePanel === 'function') {
                contentManagerPluginApis.addEditViewSidePanel([
                    Panel
                ]);
            }
            app.addSettingsLink('global', {
                id: PLUGIN_ID,
                to: `review-workflows`,
                intlLabel: {
                    id: `${PLUGIN_ID}.plugin.name`,
                    defaultMessage: 'Review Workflows'
                },
                licenseOnly: true,
                permissions: [],
                async Component () {
                    const { Router } = await import('./router.mjs');
                    return {
                        default: Router
                    };
                }
            });
            // Always put the assigned to me widget last in the list of widgets
            app.widgets.register((widgets)=>[
                    ...widgets,
                    {
                        icon: SealCheck,
                        title: {
                            id: `${PLUGIN_ID}.widget.assigned.title`,
                            defaultMessage: 'Assigned to me'
                        },
                        component: async ()=>{
                            const { AssignedWidget } = await import('./components/Widgets.mjs');
                            return AssignedWidget;
                        },
                        pluginId: PLUGIN_ID,
                        id: 'assigned',
                        permissions: [
                            {
                                action: 'plugin::content-manager.explorer.read'
                            }
                        ]
                    }
                ]);
        } else if (!window.strapi.features.isEnabled(FEATURE_ID) && window.strapi?.flags?.promoteEE) {
            app.addSettingsLink('global', {
                id: PLUGIN_ID,
                to: `purchase-review-workflows`,
                intlLabel: {
                    id: `${PLUGIN_ID}.plugin.name`,
                    defaultMessage: 'Review Workflows'
                },
                licenseOnly: true,
                permissions: [],
                async Component () {
                    const { PurchaseReviewWorkflows } = await import('./routes/purchase-review-workflows.mjs');
                    return {
                        default: PurchaseReviewWorkflows
                    };
                }
            });
        }
    },
    bootstrap (app) {
        if (window.strapi.features.isEnabled(FEATURE_ID)) {
            app.getPlugin('content-manager').injectComponent('preview', 'actions', {
                name: 'review-workflows-assignee',
                Component: Header
            });
        }
    },
    async registerTrads ({ locales }) {
        const importedTrads = await Promise.all(locales.map((locale)=>{
            return __variableDynamicImportRuntime3__(`./translations/${locale}.json`).then(({ default: data })=>{
                return {
                    data: prefixPluginTranslations(data, PLUGIN_ID),
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

export { admin as default };
//# sourceMappingURL=index.mjs.map
