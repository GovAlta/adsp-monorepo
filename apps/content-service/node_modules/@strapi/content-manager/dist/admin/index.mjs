import { Feather, Pencil, CheckCircle, PuzzlePiece } from '@strapi/icons';
import { PLUGIN_ID } from './constants/plugin.mjs';
import { ContentManagerPlugin } from './content-manager.mjs';
import { historyAdmin } from './history/index.mjs';
import { reducer } from './modules/reducers.mjs';
import { previewAdmin } from './preview/index.mjs';
import { routes } from './router.mjs';
import { prefixPluginTranslations } from './utils/translations.mjs';
import 'prismjs';
export { buildValidParams } from './utils/api.mjs';
export { RelativeTime } from './components/RelativeTime.mjs';
export { DocumentStatus } from './pages/EditView/components/DocumentStatus.mjs';
export { useContentManagerContext as unstable_useContentManagerContext, useDocument as unstable_useDocument } from './hooks/useDocument.mjs';
export { useDocumentActions as unstable_useDocumentActions } from './hooks/useDocumentActions.mjs';
export { useDocumentLayout as unstable_useDocumentLayout } from './hooks/useDocumentLayout.mjs';
export { DocumentRBAC, useDocumentRBAC } from './features/DocumentRBAC.mjs';

function __variableDynamicImportRuntime4__(path) {
  switch (path) {
    case './translations/ar.json': return import('./translations/ar.json.mjs');
    case './translations/ca.json': return import('./translations/ca.json.mjs');
    case './translations/cs.json': return import('./translations/cs.json.mjs');
    case './translations/de.json': return import('./translations/de.json.mjs');
    case './translations/en.json': return import('./translations/en.json.mjs');
    case './translations/es.json': return import('./translations/es.json.mjs');
    case './translations/eu.json': return import('./translations/eu.json.mjs');
    case './translations/fr.json': return import('./translations/fr.json.mjs');
    case './translations/gu.json': return import('./translations/gu.json.mjs');
    case './translations/hi.json': return import('./translations/hi.json.mjs');
    case './translations/hu.json': return import('./translations/hu.json.mjs');
    case './translations/id.json': return import('./translations/id.json.mjs');
    case './translations/it.json': return import('./translations/it.json.mjs');
    case './translations/ja.json': return import('./translations/ja.json.mjs');
    case './translations/ko.json': return import('./translations/ko.json.mjs');
    case './translations/ml.json': return import('./translations/ml.json.mjs');
    case './translations/ms.json': return import('./translations/ms.json.mjs');
    case './translations/nl.json': return import('./translations/nl.json.mjs');
    case './translations/pl.json': return import('./translations/pl.json.mjs');
    case './translations/pt-BR.json': return import('./translations/pt-BR.json.mjs');
    case './translations/pt.json': return import('./translations/pt.json.mjs');
    case './translations/ru.json': return import('./translations/ru.json.mjs');
    case './translations/sa.json': return import('./translations/sa.json.mjs');
    case './translations/sk.json': return import('./translations/sk.json.mjs');
    case './translations/sv.json': return import('./translations/sv.json.mjs');
    case './translations/th.json': return import('./translations/th.json.mjs');
    case './translations/tr.json': return import('./translations/tr.json.mjs');
    case './translations/uk.json': return import('./translations/uk.json.mjs');
    case './translations/vi.json': return import('./translations/vi.json.mjs');
    case './translations/zh-Hans.json': return import('./translations/zh-Hans.json.mjs');
    case './translations/zh.json': return import('./translations/zh.json.mjs');
    default: return new Promise(function(resolve, reject) {
      (typeof queueMicrotask === 'function' ? queueMicrotask : setTimeout)(
        reject.bind(null, new Error("Unknown variable dynamic import: " + path))
      );
    })
   }
 }
// eslint-disable-next-line import/no-default-export
var index = {
    register (app) {
        const cm = new ContentManagerPlugin();
        app.addReducers({
            [PLUGIN_ID]: reducer
        });
        app.addMenuLink({
            to: PLUGIN_ID,
            icon: Feather,
            intlLabel: {
                id: `content-manager.plugin.name`,
                defaultMessage: 'Content Manager'
            },
            permissions: [],
            position: 1
        });
        app.router.addRoute({
            path: 'content-manager/*',
            lazy: async ()=>{
                const { Layout } = await import('./layout.mjs');
                return {
                    Component: Layout
                };
            },
            children: routes
        });
        app.registerPlugin(cm.config);
        app.widgets.register((widgets)=>{
            const lastEditedWidget = {
                icon: Pencil,
                title: {
                    id: `${PLUGIN_ID}.widget.last-edited.title`,
                    defaultMessage: 'Last edited entries'
                },
                component: async ()=>{
                    const { LastEditedWidget } = await import('./components/Widgets.mjs');
                    return LastEditedWidget;
                },
                pluginId: PLUGIN_ID,
                id: 'last-edited-entries',
                permissions: [
                    {
                        action: 'plugin::content-manager.explorer.read'
                    }
                ]
            };
            const lastPublishedWidget = {
                icon: CheckCircle,
                title: {
                    id: `${PLUGIN_ID}.widget.last-published.title`,
                    defaultMessage: 'Last published entries'
                },
                component: async ()=>{
                    const { LastPublishedWidget } = await import('./components/Widgets.mjs');
                    return LastPublishedWidget;
                },
                pluginId: PLUGIN_ID,
                id: 'last-published-entries',
                permissions: [
                    {
                        action: 'plugin::content-manager.explorer.read'
                    }
                ]
            };
            const entriesWidget = {
                icon: PuzzlePiece,
                title: {
                    id: `${PLUGIN_ID}.widget.chart-entries.title`,
                    defaultMessage: 'Entries'
                },
                component: async ()=>{
                    const { ChartEntriesWidget } = await import('./components/Widgets.mjs');
                    return ChartEntriesWidget;
                },
                pluginId: PLUGIN_ID,
                id: 'chart-entries',
                permissions: [
                    {
                        action: 'plugin::content-manager.explorer.read'
                    }
                ]
            };
            const profileInfoIndex = widgets.findIndex((widget)=>widget.id === 'profile-info' && widget.pluginId === 'admin');
            // Insert chart-entries after the profile-info widget
            if (profileInfoIndex !== -1) {
                const newWidgets = [
                    ...widgets
                ];
                newWidgets.splice(profileInfoIndex + 1, 0, entriesWidget);
                return [
                    lastEditedWidget,
                    lastPublishedWidget,
                    ...newWidgets
                ];
            }
            // Fallback: add to the end if the target widget aren't found
            return [
                lastEditedWidget,
                lastPublishedWidget,
                ...widgets,
                entriesWidget
            ];
        });
    },
    bootstrap (app) {
        if (typeof historyAdmin.bootstrap === 'function') {
            historyAdmin.bootstrap(app);
        }
        if (typeof previewAdmin.bootstrap === 'function') {
            previewAdmin.bootstrap(app);
        }
    },
    async registerTrads ({ locales }) {
        const importedTrads = await Promise.all(locales.map((locale)=>{
            return __variableDynamicImportRuntime4__(`./translations/${locale}.json`).then(({ default: data })=>{
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

export { index as default };
//# sourceMappingURL=index.mjs.map
