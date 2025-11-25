import { strapi } from './package.json.mjs';
import { PERMISSIONS } from './constants.mjs';
import getTrad from './utils/getTrad.mjs';
import { prefixPluginTranslations } from './utils/prefixPluginTranslations.mjs';

function __variableDynamicImportRuntime4__(path) {
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
const name = strapi.name;
var index = {
    register (app) {
        // Create the plugin's settings section
        app.createSettingSection({
            id: 'users-permissions',
            intlLabel: {
                id: getTrad('Settings.section-label'),
                defaultMessage: 'Users & Permissions plugin'
            }
        }, [
            {
                intlLabel: {
                    id: 'global.roles',
                    defaultMessage: 'Roles'
                },
                id: 'roles',
                to: `users-permissions/roles`,
                Component: ()=>import('./pages/Roles/index.mjs'),
                permissions: PERMISSIONS.accessRoles
            },
            {
                intlLabel: {
                    id: getTrad('HeaderNav.link.providers'),
                    defaultMessage: 'Providers'
                },
                id: 'providers',
                to: `users-permissions/providers`,
                Component: ()=>import('./pages/Providers/index.mjs'),
                permissions: PERMISSIONS.readProviders
            },
            {
                intlLabel: {
                    id: getTrad('HeaderNav.link.emailTemplates'),
                    defaultMessage: 'Email templates'
                },
                id: 'email-templates',
                to: `users-permissions/email-templates`,
                Component: ()=>import('./pages/EmailTemplates/index.mjs').then((mod)=>({
                            default: mod.ProtectedEmailTemplatesPage
                        })),
                permissions: PERMISSIONS.readEmailTemplates
            },
            {
                intlLabel: {
                    id: getTrad('HeaderNav.link.advancedSettings'),
                    defaultMessage: 'Advanced Settings'
                },
                id: 'advanced-settings',
                to: `users-permissions/advanced-settings`,
                Component: ()=>import('./pages/AdvancedSettings/index.mjs').then((mod)=>({
                            default: mod.ProtectedAdvancedSettingsPage
                        })),
                permissions: PERMISSIONS.readAdvancedSettings
            }
        ]);
        app.registerPlugin({
            id: 'users-permissions',
            name
        });
    },
    bootstrap () {},
    async registerTrads ({ locales }) {
        const importedTrads = await Promise.all(locales.map((locale)=>{
            return __variableDynamicImportRuntime4__(`./translations/${locale}.json`).then(({ default: data })=>{
                return {
                    data: prefixPluginTranslations(data, 'users-permissions'),
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
