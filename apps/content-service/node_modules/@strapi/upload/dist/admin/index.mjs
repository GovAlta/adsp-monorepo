import { Images } from '@strapi/icons';
import pluginPkg from './package.json.mjs';
import { MediaLibraryDialog } from './components/MediaLibraryDialog/MediaLibraryDialog.mjs';
import { MediaLibraryInput } from './components/MediaLibraryInput/MediaLibraryInput.mjs';
import { PERMISSIONS } from './constants.mjs';
import { pluginId } from './pluginId.mjs';
import 'byte-size';
import 'date-fns';
import { getTrad } from './utils/getTrad.mjs';
import 'qs';
import { prefixPluginTranslations } from './utils/prefixPluginTranslations.mjs';
import './utils/urlYupSchema.mjs';

function __variableDynamicImportRuntime2__(path) {
  switch (path) {
    case './translations/ca.json': return import('./translations/ca.json.mjs');
    case './translations/de.json': return import('./translations/de.json.mjs');
    case './translations/dk.json': return import('./translations/dk.json.mjs');
    case './translations/en.json': return import('./translations/en.json.mjs');
    case './translations/es.json': return import('./translations/es.json.mjs');
    case './translations/fr.json': return import('./translations/fr.json.mjs');
    case './translations/he.json': return import('./translations/he.json.mjs');
    case './translations/it.json': return import('./translations/it.json.mjs');
    case './translations/ja.json': return import('./translations/ja.json.mjs');
    case './translations/ko.json': return import('./translations/ko.json.mjs');
    case './translations/ms.json': return import('./translations/ms.json.mjs');
    case './translations/pl.json': return import('./translations/pl.json.mjs');
    case './translations/pt-BR.json': return import('./translations/pt-BR.json.mjs');
    case './translations/pt.json': return import('./translations/pt.json.mjs');
    case './translations/ru.json': return import('./translations/ru.json.mjs');
    case './translations/sk.json': return import('./translations/sk.json.mjs');
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
const name = pluginPkg.strapi.name;
const admin = {
    register (app) {
        app.addMenuLink({
            to: `plugins/${pluginId}`,
            icon: Images,
            intlLabel: {
                id: `${pluginId}.plugin.name`,
                defaultMessage: 'Media Library'
            },
            permissions: PERMISSIONS.main,
            Component: ()=>import('./pages/App/App.mjs').then((mod)=>({
                        default: mod.Upload
                    })),
            position: 4
        });
        app.addSettingsLink('global', {
            id: 'media-library-settings',
            to: 'media-library',
            intlLabel: {
                id: getTrad('plugin.name'),
                defaultMessage: 'Media Library'
            },
            async Component () {
                const { ProtectedSettingsPage } = await import('./pages/SettingsPage/SettingsPage.mjs');
                return {
                    default: ProtectedSettingsPage
                };
            },
            permissions: PERMISSIONS.settings
        });
        app.addFields({
            type: 'media',
            Component: MediaLibraryInput
        });
        app.addComponents([
            {
                name: 'media-library',
                Component: MediaLibraryDialog
            }
        ]);
        app.registerPlugin({
            id: pluginId,
            name
        });
    },
    async registerTrads ({ locales }) {
        const importedTrads = await Promise.all(locales.map((locale)=>{
            return __variableDynamicImportRuntime2__(`./translations/${locale}.json`).then(({ default: data })=>{
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

export { admin as default };
//# sourceMappingURL=index.mjs.map
