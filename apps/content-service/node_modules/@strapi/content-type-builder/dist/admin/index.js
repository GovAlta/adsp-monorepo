'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var Icons = require('@strapi/icons');
var constants = require('./constants.js');
var pluginId = require('./pluginId.js');
var reducers = require('./reducers.js');
var formAPI = require('./utils/formAPI.js');
var prefixPluginTranslations = require('./utils/prefixPluginTranslations.js');
var AutoReloadOverlayBlocker = require('./components/AutoReloadOverlayBlocker.js');

function _interopNamespaceDefaultOnly (e) { return Object.freeze({ __proto__: null, default: e }); }

function __variableDynamicImportRuntime1__(path) {
  switch (path) {
    case './translations/ar.json': return Promise.resolve().then(function () { return require('./translations/ar.json.js'); });
    case './translations/cs.json': return Promise.resolve().then(function () { return require('./translations/cs.json.js'); });
    case './translations/de.json': return Promise.resolve().then(function () { return require('./translations/de.json.js'); });
    case './translations/dk.json': return Promise.resolve().then(function () { return require('./translations/dk.json.js'); });
    case './translations/en.json': return Promise.resolve().then(function () { return require('./translations/en.json.js'); });
    case './translations/es.json': return Promise.resolve().then(function () { return require('./translations/es.json.js'); });
    case './translations/fr.json': return Promise.resolve().then(function () { return require('./translations/fr.json.js'); });
    case './translations/id.json': return Promise.resolve().then(function () { return require('./translations/id.json.js'); });
    case './translations/it.json': return Promise.resolve().then(function () { return require('./translations/it.json.js'); });
    case './translations/ja.json': return Promise.resolve().then(function () { return require('./translations/ja.json.js'); });
    case './translations/ko.json': return Promise.resolve().then(function () { return require('./translations/ko.json.js'); });
    case './translations/ms.json': return Promise.resolve().then(function () { return require('./translations/ms.json.js'); });
    case './translations/nl.json': return Promise.resolve().then(function () { return require('./translations/nl.json.js'); });
    case './translations/pl.json': return Promise.resolve().then(function () { return require('./translations/pl.json.js'); });
    case './translations/pt-BR.json': return Promise.resolve().then(function () { return require('./translations/pt-BR.json.js'); });
    case './translations/pt.json': return Promise.resolve().then(function () { return require('./translations/pt.json.js'); });
    case './translations/ru.json': return Promise.resolve().then(function () { return require('./translations/ru.json.js'); });
    case './translations/sk.json': return Promise.resolve().then(function () { return require('./translations/sk.json.js'); });
    case './translations/sv.json': return Promise.resolve().then(function () { return require('./translations/sv.json.js'); });
    case './translations/th.json': return Promise.resolve().then(function () { return require('./translations/th.json.js'); });
    case './translations/tr.json': return Promise.resolve().then(function () { return require('./translations/tr.json.js'); });
    case './translations/uk.json': return Promise.resolve().then(function () { return require('./translations/uk.json.js'); });
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
        app.addReducers(reducers.reducers);
        app.addMenuLink({
            to: `plugins/${pluginId.pluginId}`,
            icon: Icons.Layout,
            intlLabel: {
                id: `${pluginId.pluginId}.plugin.name`,
                defaultMessage: 'Content-Type Builder'
            },
            permissions: constants.PERMISSIONS.main,
            Component: ()=>Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./pages/App/index.js')); }),
            position: 5
        });
        app.registerPlugin({
            id: pluginId.pluginId,
            name: pluginId.pluginId,
            // Internal APIs exposed by the CTB for the other plugins to use
            apis: {
                forms: formAPI.formsAPI
            }
        });
    },
    bootstrap () {},
    async registerTrads ({ locales }) {
        const importedTrads = await Promise.all(locales.map((locale)=>{
            return __variableDynamicImportRuntime1__(`./translations/${locale}.json`).then(({ default: data })=>{
                return {
                    data: prefixPluginTranslations.prefixPluginTranslations(data, pluginId.pluginId),
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

exports.private_AutoReloadOverlayBlockerProvider = AutoReloadOverlayBlocker.AutoReloadOverlayBlockerProvider;
exports.private_useAutoReloadOverlayBlocker = AutoReloadOverlayBlocker.useAutoReloadOverlayBlocker;
exports.default = index;
//# sourceMappingURL=index.js.map
