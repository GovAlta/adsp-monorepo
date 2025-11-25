'use strict';

var constants = require('./constants.js');
var prefixPluginTranslations = require('./utils/prefixPluginTranslations.js');

function _interopNamespaceDefaultOnly (e) { return Object.freeze({ __proto__: null, default: e }); }

function __variableDynamicImportRuntime1__(path) {
  switch (path) {
    case './translations/ar.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/ar.json.js')); });
    case './translations/cs.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/cs.json.js')); });
    case './translations/de.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/de.json.js')); });
    case './translations/dk.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/dk.json.js')); });
    case './translations/en.json': return Promise.resolve().then(function () { return require('./translations/en.json.js'); });
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
    case './translations/pt.json': return Promise.resolve().then(function () { return require('./translations/pt.json.js'); });
    case './translations/ru.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/ru.json.js')); });
    case './translations/sk.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/sk.json.js')); });
    case './translations/th.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/th.json.js')); });
    case './translations/tr.json': return Promise.resolve().then(function () { return require('./translations/tr.json.js'); });
    case './translations/uk.json': return Promise.resolve().then(function () { return require('./translations/uk.json.js'); });
    case './translations/vi.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/vi.json.js')); });
    case './translations/zh-Hans.json': return Promise.resolve().then(function () { return require('./translations/zh-Hans.json.js'); });
    case './translations/zh.json': return Promise.resolve().then(function () { return require('./translations/zh.json.js'); });
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
                Component: ()=>Promise.resolve().then(function () { return require('./pages/Settings.js'); }).then((mod)=>({
                            default: mod.ProtectedSettingsPage
                        })),
                permissions: constants.PERMISSIONS.settings
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
                    data: prefixPluginTranslations.prefixPluginTranslations(data, 'email'),
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
