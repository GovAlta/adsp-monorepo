'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var Icons = require('@strapi/icons');
var plugin = require('./constants/plugin.js');
var contentManager = require('./content-manager.js');
var index$1 = require('./history/index.js');
var reducers = require('./modules/reducers.js');
var index$2 = require('./preview/index.js');
var router = require('./router.js');
var translations = require('./utils/translations.js');
require('prismjs');
var api = require('./utils/api.js');
var RelativeTime = require('./components/RelativeTime.js');
var DocumentStatus = require('./pages/EditView/components/DocumentStatus.js');
var useDocument = require('./hooks/useDocument.js');
var useDocumentActions = require('./hooks/useDocumentActions.js');
var useDocumentLayout = require('./hooks/useDocumentLayout.js');
var DocumentRBAC = require('./features/DocumentRBAC.js');

function __variableDynamicImportRuntime4__(path) {
  switch (path) {
    case './translations/ar.json': return Promise.resolve().then(function () { return require('./translations/ar.json.js'); });
    case './translations/ca.json': return Promise.resolve().then(function () { return require('./translations/ca.json.js'); });
    case './translations/cs.json': return Promise.resolve().then(function () { return require('./translations/cs.json.js'); });
    case './translations/de.json': return Promise.resolve().then(function () { return require('./translations/de.json.js'); });
    case './translations/en.json': return Promise.resolve().then(function () { return require('./translations/en.json.js'); });
    case './translations/es.json': return Promise.resolve().then(function () { return require('./translations/es.json.js'); });
    case './translations/eu.json': return Promise.resolve().then(function () { return require('./translations/eu.json.js'); });
    case './translations/fr.json': return Promise.resolve().then(function () { return require('./translations/fr.json.js'); });
    case './translations/gu.json': return Promise.resolve().then(function () { return require('./translations/gu.json.js'); });
    case './translations/hi.json': return Promise.resolve().then(function () { return require('./translations/hi.json.js'); });
    case './translations/hu.json': return Promise.resolve().then(function () { return require('./translations/hu.json.js'); });
    case './translations/id.json': return Promise.resolve().then(function () { return require('./translations/id.json.js'); });
    case './translations/it.json': return Promise.resolve().then(function () { return require('./translations/it.json.js'); });
    case './translations/ja.json': return Promise.resolve().then(function () { return require('./translations/ja.json.js'); });
    case './translations/ko.json': return Promise.resolve().then(function () { return require('./translations/ko.json.js'); });
    case './translations/ml.json': return Promise.resolve().then(function () { return require('./translations/ml.json.js'); });
    case './translations/ms.json': return Promise.resolve().then(function () { return require('./translations/ms.json.js'); });
    case './translations/nl.json': return Promise.resolve().then(function () { return require('./translations/nl.json.js'); });
    case './translations/pl.json': return Promise.resolve().then(function () { return require('./translations/pl.json.js'); });
    case './translations/pt-BR.json': return Promise.resolve().then(function () { return require('./translations/pt-BR.json.js'); });
    case './translations/pt.json': return Promise.resolve().then(function () { return require('./translations/pt.json.js'); });
    case './translations/ru.json': return Promise.resolve().then(function () { return require('./translations/ru.json.js'); });
    case './translations/sa.json': return Promise.resolve().then(function () { return require('./translations/sa.json.js'); });
    case './translations/sk.json': return Promise.resolve().then(function () { return require('./translations/sk.json.js'); });
    case './translations/sv.json': return Promise.resolve().then(function () { return require('./translations/sv.json.js'); });
    case './translations/th.json': return Promise.resolve().then(function () { return require('./translations/th.json.js'); });
    case './translations/tr.json': return Promise.resolve().then(function () { return require('./translations/tr.json.js'); });
    case './translations/uk.json': return Promise.resolve().then(function () { return require('./translations/uk.json.js'); });
    case './translations/vi.json': return Promise.resolve().then(function () { return require('./translations/vi.json.js'); });
    case './translations/zh-Hans.json': return Promise.resolve().then(function () { return require('./translations/zh-Hans.json.js'); });
    case './translations/zh.json': return Promise.resolve().then(function () { return require('./translations/zh.json.js'); });
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
        const cm = new contentManager.ContentManagerPlugin();
        app.addReducers({
            [plugin.PLUGIN_ID]: reducers.reducer
        });
        app.addMenuLink({
            to: plugin.PLUGIN_ID,
            icon: Icons.Feather,
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
                const { Layout } = await Promise.resolve().then(function () { return require('./layout.js'); });
                return {
                    Component: Layout
                };
            },
            children: router.routes
        });
        app.registerPlugin(cm.config);
        app.widgets.register((widgets)=>{
            const lastEditedWidget = {
                icon: Icons.Pencil,
                title: {
                    id: `${plugin.PLUGIN_ID}.widget.last-edited.title`,
                    defaultMessage: 'Last edited entries'
                },
                component: async ()=>{
                    const { LastEditedWidget } = await Promise.resolve().then(function () { return require('./components/Widgets.js'); });
                    return LastEditedWidget;
                },
                pluginId: plugin.PLUGIN_ID,
                id: 'last-edited-entries',
                permissions: [
                    {
                        action: 'plugin::content-manager.explorer.read'
                    }
                ]
            };
            const lastPublishedWidget = {
                icon: Icons.CheckCircle,
                title: {
                    id: `${plugin.PLUGIN_ID}.widget.last-published.title`,
                    defaultMessage: 'Last published entries'
                },
                component: async ()=>{
                    const { LastPublishedWidget } = await Promise.resolve().then(function () { return require('./components/Widgets.js'); });
                    return LastPublishedWidget;
                },
                pluginId: plugin.PLUGIN_ID,
                id: 'last-published-entries',
                permissions: [
                    {
                        action: 'plugin::content-manager.explorer.read'
                    }
                ]
            };
            const entriesWidget = {
                icon: Icons.PuzzlePiece,
                title: {
                    id: `${plugin.PLUGIN_ID}.widget.chart-entries.title`,
                    defaultMessage: 'Entries'
                },
                component: async ()=>{
                    const { ChartEntriesWidget } = await Promise.resolve().then(function () { return require('./components/Widgets.js'); });
                    return ChartEntriesWidget;
                },
                pluginId: plugin.PLUGIN_ID,
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
        if (typeof index$1.historyAdmin.bootstrap === 'function') {
            index$1.historyAdmin.bootstrap(app);
        }
        if (typeof index$2.previewAdmin.bootstrap === 'function') {
            index$2.previewAdmin.bootstrap(app);
        }
    },
    async registerTrads ({ locales }) {
        const importedTrads = await Promise.all(locales.map((locale)=>{
            return __variableDynamicImportRuntime4__(`./translations/${locale}.json`).then(({ default: data })=>{
                return {
                    data: translations.prefixPluginTranslations(data, plugin.PLUGIN_ID),
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

exports.buildValidParams = api.buildValidParams;
exports.RelativeTime = RelativeTime.RelativeTime;
exports.DocumentStatus = DocumentStatus.DocumentStatus;
exports.unstable_useContentManagerContext = useDocument.useContentManagerContext;
exports.unstable_useDocument = useDocument.useDocument;
exports.unstable_useDocumentActions = useDocumentActions.useDocumentActions;
exports.unstable_useDocumentLayout = useDocumentLayout.useDocumentLayout;
exports.DocumentRBAC = DocumentRBAC.DocumentRBAC;
exports.useDocumentRBAC = DocumentRBAC.useDocumentRBAC;
exports.default = index;
//# sourceMappingURL=index.js.map
