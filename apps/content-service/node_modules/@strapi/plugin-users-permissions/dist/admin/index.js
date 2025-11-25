'use strict';

var _package = require('./package.json.js');
var constants = require('./constants.js');
var getTrad = require('./utils/getTrad.js');
var prefixPluginTranslations = require('./utils/prefixPluginTranslations.js');

function _interopNamespaceDefaultOnly (e) { return Object.freeze({ __proto__: null, default: e }); }

function __variableDynamicImportRuntime4__(path) {
  switch (path) {
    case './translations/ar.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/ar.json.js')); });
    case './translations/cs.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/cs.json.js')); });
    case './translations/de.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/de.json.js')); });
    case './translations/dk.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/dk.json.js')); });
    case './translations/en.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/en.json.js')); });
    case './translations/es.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/es.json.js')); });
    case './translations/fr.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/fr.json.js')); });
    case './translations/id.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/id.json.js')); });
    case './translations/it.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/it.json.js')); });
    case './translations/ja.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/ja.json.js')); });
    case './translations/ko.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/ko.json.js')); });
    case './translations/ms.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/ms.json.js')); });
    case './translations/nl.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/nl.json.js')); });
    case './translations/pl.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/pl.json.js')); });
    case './translations/pt-BR.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/pt-BR.json.js')); });
    case './translations/pt.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/pt.json.js')); });
    case './translations/ru.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/ru.json.js')); });
    case './translations/sk.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/sk.json.js')); });
    case './translations/sv.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/sv.json.js')); });
    case './translations/th.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/th.json.js')); });
    case './translations/tr.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/tr.json.js')); });
    case './translations/uk.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/uk.json.js')); });
    case './translations/vi.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/vi.json.js')); });
    case './translations/zh-Hans.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/zh-Hans.json.js')); });
    case './translations/zh.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/zh.json.js')); });
    default: return new Promise(function(resolve, reject) {
      (typeof queueMicrotask === 'function' ? queueMicrotask : setTimeout)(
        reject.bind(null, new Error("Unknown variable dynamic import: " + path))
      );
    })
   }
 }
const name = _package.strapi.name;
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
                Component: ()=>Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./pages/Roles/index.js')); }),
                permissions: constants.PERMISSIONS.accessRoles
            },
            {
                intlLabel: {
                    id: getTrad('HeaderNav.link.providers'),
                    defaultMessage: 'Providers'
                },
                id: 'providers',
                to: `users-permissions/providers`,
                Component: ()=>Promise.resolve().then(function () { return require('./pages/Providers/index.js'); }),
                permissions: constants.PERMISSIONS.readProviders
            },
            {
                intlLabel: {
                    id: getTrad('HeaderNav.link.emailTemplates'),
                    defaultMessage: 'Email templates'
                },
                id: 'email-templates',
                to: `users-permissions/email-templates`,
                Component: ()=>Promise.resolve().then(function () { return require('./pages/EmailTemplates/index.js'); }).then((mod)=>({
                            default: mod.ProtectedEmailTemplatesPage
                        })),
                permissions: constants.PERMISSIONS.readEmailTemplates
            },
            {
                intlLabel: {
                    id: getTrad('HeaderNav.link.advancedSettings'),
                    defaultMessage: 'Advanced Settings'
                },
                id: 'advanced-settings',
                to: `users-permissions/advanced-settings`,
                Component: ()=>Promise.resolve().then(function () { return require('./pages/AdvancedSettings/index.js'); }).then((mod)=>({
                            default: mod.ProtectedAdvancedSettingsPage
                        })),
                permissions: constants.PERMISSIONS.readAdvancedSettings
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
                    data: prefixPluginTranslations.prefixPluginTranslations(data, 'users-permissions'),
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

module.exports = index;
//# sourceMappingURL=index.js.map
