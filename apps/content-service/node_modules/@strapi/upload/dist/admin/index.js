'use strict';

var icons = require('@strapi/icons');
var _package = require('./package.json.js');
var MediaLibraryDialog = require('./components/MediaLibraryDialog/MediaLibraryDialog.js');
var MediaLibraryInput = require('./components/MediaLibraryInput/MediaLibraryInput.js');
var constants = require('./constants.js');
var pluginId = require('./pluginId.js');
require('byte-size');
require('date-fns');
var getTrad = require('./utils/getTrad.js');
require('qs');
var prefixPluginTranslations = require('./utils/prefixPluginTranslations.js');
require('./utils/urlYupSchema.js');

function _interopNamespaceDefaultOnly (e) { return Object.freeze({ __proto__: null, default: e }); }

function __variableDynamicImportRuntime2__(path) {
  switch (path) {
    case './translations/ca.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/ca.json.js')); });
    case './translations/de.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/de.json.js')); });
    case './translations/dk.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/dk.json.js')); });
    case './translations/en.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/en.json.js')); });
    case './translations/es.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/es.json.js')); });
    case './translations/fr.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/fr.json.js')); });
    case './translations/he.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/he.json.js')); });
    case './translations/it.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/it.json.js')); });
    case './translations/ja.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/ja.json.js')); });
    case './translations/ko.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/ko.json.js')); });
    case './translations/ms.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/ms.json.js')); });
    case './translations/pl.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/pl.json.js')); });
    case './translations/pt-BR.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/pt-BR.json.js')); });
    case './translations/pt.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/pt.json.js')); });
    case './translations/ru.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/ru.json.js')); });
    case './translations/sk.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/sk.json.js')); });
    case './translations/th.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/th.json.js')); });
    case './translations/tr.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/tr.json.js')); });
    case './translations/uk.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/uk.json.js')); });
    case './translations/zh-Hans.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/zh-Hans.json.js')); });
    case './translations/zh.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/zh.json.js')); });
    default: return new Promise(function(resolve, reject) {
      (typeof queueMicrotask === 'function' ? queueMicrotask : setTimeout)(
        reject.bind(null, new Error("Unknown variable dynamic import: " + path))
      );
    })
   }
 }
const name = _package.default.strapi.name;
const admin = {
    register (app) {
        app.addMenuLink({
            to: `plugins/${pluginId.pluginId}`,
            icon: icons.Images,
            intlLabel: {
                id: `${pluginId.pluginId}.plugin.name`,
                defaultMessage: 'Media Library'
            },
            permissions: constants.PERMISSIONS.main,
            Component: ()=>Promise.resolve().then(function () { return require('./pages/App/App.js'); }).then((mod)=>({
                        default: mod.Upload
                    })),
            position: 4
        });
        app.addSettingsLink('global', {
            id: 'media-library-settings',
            to: 'media-library',
            intlLabel: {
                id: getTrad.getTrad('plugin.name'),
                defaultMessage: 'Media Library'
            },
            async Component () {
                const { ProtectedSettingsPage } = await Promise.resolve().then(function () { return require('./pages/SettingsPage/SettingsPage.js'); });
                return {
                    default: ProtectedSettingsPage
                };
            },
            permissions: constants.PERMISSIONS.settings
        });
        app.addFields({
            type: 'media',
            Component: MediaLibraryInput.MediaLibraryInput
        });
        app.addComponents([
            {
                name: 'media-library',
                Component: MediaLibraryDialog.MediaLibraryDialog
            }
        ]);
        app.registerPlugin({
            id: pluginId.pluginId,
            name
        });
    },
    async registerTrads ({ locales }) {
        const importedTrads = await Promise.all(locales.map((locale)=>{
            return __variableDynamicImportRuntime2__(`./translations/${locale}.json`).then(({ default: data })=>{
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

module.exports = admin;
//# sourceMappingURL=index.js.map
