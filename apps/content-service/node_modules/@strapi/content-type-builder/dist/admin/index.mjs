import { Layout } from '@strapi/icons';
import { PERMISSIONS } from './constants.mjs';
import { pluginId } from './pluginId.mjs';
import { reducers } from './reducers.mjs';
import { formsAPI } from './utils/formAPI.mjs';
import { prefixPluginTranslations } from './utils/prefixPluginTranslations.mjs';
export { AutoReloadOverlayBlockerProvider as private_AutoReloadOverlayBlockerProvider, useAutoReloadOverlayBlocker as private_useAutoReloadOverlayBlocker } from './components/AutoReloadOverlayBlocker.mjs';

function __variableDynamicImportRuntime1__(path) {
  switch (path) {
    case './translations/ar.json': return import('./translations/ar.json.mjs');
    case './translations/cs.json': return import('./translations/cs.json.mjs');
    case './translations/de.json': return import('./translations/de.json.mjs');
    case './translations/dk.json': return import('./translations/dk.json.mjs');
    case './translations/en.json': return import('./translations/en.json.mjs');
    case './translations/es.json': return import('./translations/es.json.mjs');
    case './translations/fr.json': return import('./translations/fr.json.mjs');
    case './translations/id.json': return import('./translations/id.json.mjs');
    case './translations/it.json': return import('./translations/it.json.mjs');
    case './translations/ja.json': return import('./translations/ja.json.mjs');
    case './translations/ko.json': return import('./translations/ko.json.mjs');
    case './translations/ms.json': return import('./translations/ms.json.mjs');
    case './translations/nl.json': return import('./translations/nl.json.mjs');
    case './translations/pl.json': return import('./translations/pl.json.mjs');
    case './translations/pt-BR.json': return import('./translations/pt-BR.json.mjs');
    case './translations/pt.json': return import('./translations/pt.json.mjs');
    case './translations/ru.json': return import('./translations/ru.json.mjs');
    case './translations/sk.json': return import('./translations/sk.json.mjs');
    case './translations/sv.json': return import('./translations/sv.json.mjs');
    case './translations/th.json': return import('./translations/th.json.mjs');
    case './translations/tr.json': return import('./translations/tr.json.mjs');
    case './translations/uk.json': return import('./translations/uk.json.mjs');
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
        app.addReducers(reducers);
        app.addMenuLink({
            to: `plugins/${pluginId}`,
            icon: Layout,
            intlLabel: {
                id: `${pluginId}.plugin.name`,
                defaultMessage: 'Content-Type Builder'
            },
            permissions: PERMISSIONS.main,
            Component: ()=>import('./pages/App/index.mjs'),
            position: 5
        });
        app.registerPlugin({
            id: pluginId,
            name: pluginId,
            // Internal APIs exposed by the CTB for the other plugins to use
            apis: {
                forms: formsAPI
            }
        });
    },
    bootstrap () {},
    async registerTrads ({ locales }) {
        const importedTrads = await Promise.all(locales.map((locale)=>{
            return __variableDynamicImportRuntime1__(`./translations/${locale}.json`).then(({ default: data })=>{
                return {
                    data: prefixPluginTranslations(data, pluginId),
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
