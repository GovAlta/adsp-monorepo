'use strict';

var get = require('lodash/get');
var yup = require('yup');
var CheckboxConfirmation = require('./components/CheckboxConfirmation.js');
var CMHeaderActions = require('./components/CMHeaderActions.js');
var CMListViewModalsAdditionalInformation = require('./components/CMListViewModalsAdditionalInformation.js');
var LocalePicker = require('./components/LocalePicker.js');
var constants = require('./constants.js');
var editView = require('./contentManagerHooks/editView.js');
var listView = require('./contentManagerHooks/listView.js');
var releaseDetailsView = require('./contentReleasesHooks/releaseDetailsView.js');
var extendCTBAttributeInitialData = require('./middlewares/extendCTBAttributeInitialData.js');
var extendCTBInitialData = require('./middlewares/extendCTBInitialData.js');
var rbacMiddleware = require('./middlewares/rbac-middleware.js');
var pluginId = require('./pluginId.js');
var api = require('./services/api.js');
var fields = require('./utils/fields.js');
var getTranslation = require('./utils/getTranslation.js');
var prefixPluginTranslations = require('./utils/prefixPluginTranslations.js');
var schemas = require('./utils/schemas.js');

function _interopNamespaceDefaultOnly (e) { return Object.freeze({ __proto__: null, default: e }); }

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var yup__namespace = /*#__PURE__*/_interopNamespaceDefault(yup);

function __variableDynamicImportRuntime1__(path) {
  switch (path) {
    case './translations/de.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/de.json.js')); });
    case './translations/dk.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/dk.json.js')); });
    case './translations/en.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/en.json.js')); });
    case './translations/es.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/es.json.js')); });
    case './translations/fr.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/fr.json.js')); });
    case './translations/ko.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/ko.json.js')); });
    case './translations/pl.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/pl.json.js')); });
    case './translations/ru.json': return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespaceDefaultOnly(require('./translations/ru.json.js')); });
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
// eslint-disable-next-line import/no-default-export
var index = {
    register (app) {
        app.addMiddlewares([
            extendCTBAttributeInitialData.extendCTBAttributeInitialDataMiddleware,
            extendCTBInitialData.extendCTBInitialDataMiddleware
        ]);
        app.addMiddlewares([
            ()=>api.i18nApi.middleware
        ]);
        app.addReducers({
            [api.i18nApi.reducerPath]: api.i18nApi.reducer
        });
        app.addRBACMiddleware([
            rbacMiddleware.localeMiddleware
        ]);
        app.registerPlugin({
            id: pluginId.pluginId,
            name: pluginId.pluginId
        });
    },
    bootstrap (app) {
        // // Hook that adds a column into the CM's LV table
        app.registerHook('Admin/CM/pages/ListView/inject-column-in-table', listView.addColumnToTableHook);
        app.registerHook('Admin/CM/pages/EditView/mutate-edit-view-layout', editView.mutateEditViewHook);
        // Hooks that checks if the locale is present in the release
        app.registerHook('ContentReleases/pages/ReleaseDetails/add-locale-in-releases', releaseDetailsView.addLocaleToReleasesHook);
        // Add the settings link
        app.addSettingsLink('global', {
            intlLabel: {
                id: getTranslation.getTranslation('plugin.name'),
                defaultMessage: 'Internationalization'
            },
            id: 'internationalization',
            to: 'internationalization',
            Component: ()=>Promise.resolve().then(function () { return require('./pages/SettingsPage.js'); }).then((mod)=>({
                        default: mod.ProtectedSettingsPage
                    })),
            permissions: constants.PERMISSIONS.accessMain
        });
        const contentManager = app.getPlugin('content-manager');
        contentManager.apis.addDocumentHeaderAction([
            CMHeaderActions.LocalePickerAction,
            CMHeaderActions.FillFromAnotherLocaleAction
        ]);
        contentManager.apis.addDocumentAction((actions)=>{
            const indexOfDeleteAction = actions.findIndex((action)=>action.type === 'delete');
            actions.splice(indexOfDeleteAction, 0, CMHeaderActions.DeleteLocaleAction);
            return actions;
        });
        contentManager.apis.addDocumentAction((actions)=>{
            // When enabled the bulk locale publish action should be the first action
            // in 'More Document Actions' and therefore the third action in the array
            actions.splice(2, 0, CMHeaderActions.BulkLocalePublishAction);
            actions.splice(5, 0, CMHeaderActions.BulkLocaleUnpublishAction);
            return actions;
        });
        contentManager.injectComponent('listView', 'actions', {
            name: 'i18n-locale-filter',
            Component: LocalePicker.LocalePicker
        });
        contentManager.injectComponent('listView', 'publishModalAdditionalInfos', {
            name: 'i18n-publish-bullets-in-modal',
            Component: CMListViewModalsAdditionalInformation.PublishModalAdditionalInfo
        });
        contentManager.injectComponent('listView', 'unpublishModalAdditionalInfos', {
            name: 'i18n-unpublish-bullets-in-modal',
            Component: CMListViewModalsAdditionalInformation.UnpublishModalAdditionalInfo
        });
        contentManager.injectComponent('listView', 'deleteModalAdditionalInfos', {
            name: 'i18n-delete-bullets-in-modal',
            Component: CMListViewModalsAdditionalInformation.DeleteModalAdditionalInfo
        });
        const ctbPlugin = app.getPlugin('content-type-builder');
        if (ctbPlugin) {
            const ctbFormsAPI = ctbPlugin.apis.forms;
            ctbFormsAPI.addContentTypeSchemaMutation(schemas.mutateCTBContentTypeSchema);
            ctbFormsAPI.components.add({
                id: 'checkboxConfirmation',
                component: CheckboxConfirmation.CheckboxConfirmation
            });
            ctbFormsAPI.extendContentType({
                validator: ()=>({
                        i18n: yup__namespace.object().shape({
                            localized: yup__namespace.bool()
                        })
                    }),
                form: {
                    advanced () {
                        return [
                            {
                                name: 'pluginOptions.i18n.localized',
                                description: {
                                    id: getTranslation.getTranslation('plugin.schema.i18n.localized.description-content-type'),
                                    defaultMessage: 'Allows translating an entry into different languages'
                                },
                                type: 'checkboxConfirmation',
                                intlLabel: {
                                    id: getTranslation.getTranslation('plugin.schema.i18n.localized.label-content-type'),
                                    defaultMessage: 'Localization'
                                }
                            }
                        ];
                    }
                }
            });
            ctbFormsAPI.extendFields(fields.LOCALIZED_FIELDS, {
                form: {
                    advanced ({ contentTypeSchema, forTarget, type, step }) {
                        if (forTarget !== 'contentType') {
                            return [];
                        }
                        const hasI18nEnabled = get(contentTypeSchema, [
                            'pluginOptions',
                            'i18n',
                            'localized'
                        ], false);
                        if (!hasI18nEnabled) {
                            return [];
                        }
                        if (type === 'component' && step === '1') {
                            return [];
                        }
                        return [
                            {
                                name: 'pluginOptions.i18n.localized',
                                description: {
                                    id: getTranslation.getTranslation('plugin.schema.i18n.localized.description-field'),
                                    defaultMessage: 'The field can have different values in each locale'
                                },
                                type: 'checkbox',
                                intlLabel: {
                                    id: getTranslation.getTranslation('plugin.schema.i18n.localized.label-field'),
                                    defaultMessage: 'Enable localization for this field'
                                }
                            }
                        ];
                    }
                }
            });
        }
    },
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

module.exports = index;
//# sourceMappingURL=index.js.map
