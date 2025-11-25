import { PERMISSIONS } from './constants.mjs';
import { prefixPluginTranslations } from './utils/prefixPluginTranslations.mjs';

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
const admin = {
    // TODO typing app in strapi/types as every plugin needs it
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    register (app) {
        // Create the email settings section
        app.createSettingSection({
            id: 'email',
            intlLabel: {
                id: 'email.SettingsNav.section-label',
                defaultMessage: 'Email Plugin'
            }
        }, [
            {
                intlLabel: {
                    id: 'email.Settings.email.plugin.title',
                    defaultMessage: 'Settings'
                },
                id: 'settings',
                to: 'email',
                Component: ()=>import('./pages/Settings.mjs').then((mod)=>({
                            default: mod.ProtectedSettingsPage
                        })),
                permissions: PERMISSIONS.settings
            }
        ]);
        app.registerPlugin({
            id: 'email',
            name: 'email'
        });
    },
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    bootstrap () {},
    async registerTrads ({ locales }) {
        const importedTrads = await Promise.all(locales.map((locale)=>{
            return __variableDynamicImportRuntime1__(`./translations/${locale}.json`).then(({ default: data })=>{
                return {
                    data: prefixPluginTranslations(data, 'email'),
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
