import get from 'lodash/get';
import * as yup from 'yup';
import { CheckboxConfirmation } from './components/CheckboxConfirmation.mjs';
import { LocalePickerAction, FillFromAnotherLocaleAction, DeleteLocaleAction, BulkLocalePublishAction, BulkLocaleUnpublishAction } from './components/CMHeaderActions.mjs';
import { PublishModalAdditionalInfo, UnpublishModalAdditionalInfo, DeleteModalAdditionalInfo } from './components/CMListViewModalsAdditionalInformation.mjs';
import { LocalePicker } from './components/LocalePicker.mjs';
import { PERMISSIONS } from './constants.mjs';
import { mutateEditViewHook } from './contentManagerHooks/editView.mjs';
import { addColumnToTableHook } from './contentManagerHooks/listView.mjs';
import { addLocaleToReleasesHook } from './contentReleasesHooks/releaseDetailsView.mjs';
import { extendCTBAttributeInitialDataMiddleware } from './middlewares/extendCTBAttributeInitialData.mjs';
import { extendCTBInitialDataMiddleware } from './middlewares/extendCTBInitialData.mjs';
import { localeMiddleware } from './middlewares/rbac-middleware.mjs';
import { pluginId } from './pluginId.mjs';
import { i18nApi } from './services/api.mjs';
import { LOCALIZED_FIELDS } from './utils/fields.mjs';
import { getTranslation } from './utils/getTranslation.mjs';
import { prefixPluginTranslations } from './utils/prefixPluginTranslations.mjs';
import { mutateCTBContentTypeSchema } from './utils/schemas.mjs';

function __variableDynamicImportRuntime1__(path) {
  switch (path) {
    case './translations/de.json': return import('./translations/de.json.mjs');
    case './translations/dk.json': return import('./translations/dk.json.mjs');
    case './translations/en.json': return import('./translations/en.json.mjs');
    case './translations/es.json': return import('./translations/es.json.mjs');
    case './translations/fr.json': return import('./translations/fr.json.mjs');
    case './translations/ko.json': return import('./translations/ko.json.mjs');
    case './translations/pl.json': return import('./translations/pl.json.mjs');
    case './translations/ru.json': return import('./translations/ru.json.mjs');
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
        app.addMiddlewares([
            extendCTBAttributeInitialDataMiddleware,
            extendCTBInitialDataMiddleware
        ]);
        app.addMiddlewares([
            ()=>i18nApi.middleware
        ]);
        app.addReducers({
            [i18nApi.reducerPath]: i18nApi.reducer
        });
        app.addRBACMiddleware([
            localeMiddleware
        ]);
        app.registerPlugin({
            id: pluginId,
            name: pluginId
        });
    },
    bootstrap (app) {
        // // Hook that adds a column into the CM's LV table
        app.registerHook('Admin/CM/pages/ListView/inject-column-in-table', addColumnToTableHook);
        app.registerHook('Admin/CM/pages/EditView/mutate-edit-view-layout', mutateEditViewHook);
        // Hooks that checks if the locale is present in the release
        app.registerHook('ContentReleases/pages/ReleaseDetails/add-locale-in-releases', addLocaleToReleasesHook);
        // Add the settings link
        app.addSettingsLink('global', {
            intlLabel: {
                id: getTranslation('plugin.name'),
                defaultMessage: 'Internationalization'
            },
            id: 'internationalization',
            to: 'internationalization',
            Component: ()=>import('./pages/SettingsPage.mjs').then((mod)=>({
                        default: mod.ProtectedSettingsPage
                    })),
            permissions: PERMISSIONS.accessMain
        });
        const contentManager = app.getPlugin('content-manager');
        contentManager.apis.addDocumentHeaderAction([
            LocalePickerAction,
            FillFromAnotherLocaleAction
        ]);
        contentManager.apis.addDocumentAction((actions)=>{
            const indexOfDeleteAction = actions.findIndex((action)=>action.type === 'delete');
            actions.splice(indexOfDeleteAction, 0, DeleteLocaleAction);
            return actions;
        });
        contentManager.apis.addDocumentAction((actions)=>{
            // When enabled the bulk locale publish action should be the first action
            // in 'More Document Actions' and therefore the third action in the array
            actions.splice(2, 0, BulkLocalePublishAction);
            actions.splice(5, 0, BulkLocaleUnpublishAction);
            return actions;
        });
        contentManager.injectComponent('listView', 'actions', {
            name: 'i18n-locale-filter',
            Component: LocalePicker
        });
        contentManager.injectComponent('listView', 'publishModalAdditionalInfos', {
            name: 'i18n-publish-bullets-in-modal',
            Component: PublishModalAdditionalInfo
        });
        contentManager.injectComponent('listView', 'unpublishModalAdditionalInfos', {
            name: 'i18n-unpublish-bullets-in-modal',
            Component: UnpublishModalAdditionalInfo
        });
        contentManager.injectComponent('listView', 'deleteModalAdditionalInfos', {
            name: 'i18n-delete-bullets-in-modal',
            Component: DeleteModalAdditionalInfo
        });
        const ctbPlugin = app.getPlugin('content-type-builder');
        if (ctbPlugin) {
            const ctbFormsAPI = ctbPlugin.apis.forms;
            ctbFormsAPI.addContentTypeSchemaMutation(mutateCTBContentTypeSchema);
            ctbFormsAPI.components.add({
                id: 'checkboxConfirmation',
                component: CheckboxConfirmation
            });
            ctbFormsAPI.extendContentType({
                validator: ()=>({
                        i18n: yup.object().shape({
                            localized: yup.bool()
                        })
                    }),
                form: {
                    advanced () {
                        return [
                            {
                                name: 'pluginOptions.i18n.localized',
                                description: {
                                    id: getTranslation('plugin.schema.i18n.localized.description-content-type'),
                                    defaultMessage: 'Allows translating an entry into different languages'
                                },
                                type: 'checkboxConfirmation',
                                intlLabel: {
                                    id: getTranslation('plugin.schema.i18n.localized.label-content-type'),
                                    defaultMessage: 'Localization'
                                }
                            }
                        ];
                    }
                }
            });
            ctbFormsAPI.extendFields(LOCALIZED_FIELDS, {
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
                                    id: getTranslation('plugin.schema.i18n.localized.description-field'),
                                    defaultMessage: 'The field can have different values in each locale'
                                },
                                type: 'checkbox',
                                intlLabel: {
                                    id: getTranslation('plugin.schema.i18n.localized.label-field'),
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
