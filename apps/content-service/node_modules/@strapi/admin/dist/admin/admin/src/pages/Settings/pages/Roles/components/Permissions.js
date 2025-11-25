'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var immer = require('immer');
var cloneDeep = require('lodash/cloneDeep');
var get = require('lodash/get');
var has = require('lodash/has');
var isEmpty = require('lodash/isEmpty');
var set = require('lodash/set');
var reactIntl = require('react-intl');
var objects = require('../../../../../utils/objects.js');
var usePermissionsDataManager = require('../hooks/usePermissionsDataManager.js');
var difference = require('../utils/difference.js');
var forms = require('../utils/forms.js');
var layouts = require('../utils/layouts.js');
var permissions = require('../utils/permissions.js');
var updateConditionsToFalse = require('../utils/updateConditionsToFalse.js');
var updateValues = require('../utils/updateValues.js');
var ContentTypes = require('./ContentTypes.js');
var PluginsAndSettings = require('./PluginsAndSettings.js');

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

var React__namespace = /*#__PURE__*/_interopNamespaceDefault(React);

const TAB_LABELS = [
    {
        labelId: 'app.components.LeftMenuLinkContainer.collectionTypes',
        defaultMessage: 'Collection Types',
        id: 'collectionTypes'
    },
    {
        labelId: 'app.components.LeftMenuLinkContainer.singleTypes',
        id: 'singleTypes',
        defaultMessage: 'Single Types'
    },
    {
        labelId: 'app.components.LeftMenuLinkContainer.plugins',
        defaultMessage: 'Plugins',
        id: 'plugins'
    },
    {
        labelId: 'app.components.LeftMenuLinkContainer.settings',
        defaultMessage: 'Settings',
        id: 'settings'
    }
];
const Permissions = /*#__PURE__*/ React__namespace.forwardRef(({ layout, isFormDisabled, permissions: permissions$1 = [] }, api)=>{
    const [{ initialData, layouts, modifiedData }, dispatch] = React__namespace.useReducer(reducer, initialState, ()=>init(layout, permissions$1));
    const { formatMessage } = reactIntl.useIntl();
    React__namespace.useImperativeHandle(api, ()=>{
        return {
            getPermissions () {
                const collectionTypesDiff = difference.difference(initialData.collectionTypes, modifiedData.collectionTypes);
                const singleTypesDiff = difference.difference(initialData.singleTypes, modifiedData.singleTypes);
                const contentTypesDiff = {
                    ...collectionTypesDiff,
                    ...singleTypesDiff
                };
                let didUpdateConditions;
                if (isEmpty(contentTypesDiff)) {
                    didUpdateConditions = false;
                } else {
                    didUpdateConditions = Object.values(contentTypesDiff).some((permission = {})=>{
                        return Object.values(permission).some((permissionValue)=>has(permissionValue, 'conditions'));
                    });
                }
                return {
                    permissionsToSend: permissions.formatPermissionsForAPI(modifiedData),
                    didUpdateConditions
                };
            },
            resetForm () {
                dispatch({
                    type: 'RESET_FORM'
                });
            },
            setFormAfterSubmit () {
                dispatch({
                    type: 'SET_FORM_AFTER_SUBMIT'
                });
            }
        };
    });
    const handleChangeCollectionTypeLeftActionRowCheckbox = (pathToCollectionType, propertyName, rowName, value)=>{
        dispatch({
            type: 'ON_CHANGE_COLLECTION_TYPE_ROW_LEFT_CHECKBOX',
            pathToCollectionType,
            propertyName,
            rowName,
            value
        });
    };
    const handleChangeCollectionTypeGlobalActionCheckbox = (collectionTypeKind, actionId, value)=>{
        dispatch({
            type: 'ON_CHANGE_COLLECTION_TYPE_GLOBAL_ACTION_CHECKBOX',
            collectionTypeKind,
            actionId,
            value
        });
    };
    const handleChangeConditions = (conditions)=>{
        dispatch({
            type: 'ON_CHANGE_CONDITIONS',
            conditions
        });
    };
    const handleChangeSimpleCheckbox = React__namespace.useCallback(({ target: { name, value } })=>{
        dispatch({
            type: 'ON_CHANGE_SIMPLE_CHECKBOX',
            keys: name,
            value
        });
    }, []);
    const handleChangeParentCheckbox = React__namespace.useCallback(({ target: { name, value } })=>{
        dispatch({
            type: 'ON_CHANGE_TOGGLE_PARENT_CHECKBOX',
            keys: name,
            value
        });
    }, []);
    return /*#__PURE__*/ jsxRuntime.jsx(usePermissionsDataManager.PermissionsDataManagerProvider, {
        availableConditions: layout.conditions,
        modifiedData: modifiedData,
        onChangeConditions: handleChangeConditions,
        onChangeSimpleCheckbox: handleChangeSimpleCheckbox,
        onChangeParentCheckbox: handleChangeParentCheckbox,
        onChangeCollectionTypeLeftActionRowCheckbox: handleChangeCollectionTypeLeftActionRowCheckbox,
        onChangeCollectionTypeGlobalActionCheckbox: handleChangeCollectionTypeGlobalActionCheckbox,
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Tabs.Root, {
            defaultValue: TAB_LABELS[0].id,
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tabs.List, {
                    "aria-label": formatMessage({
                        id: 'Settings.permissions.users.tabs.label',
                        defaultMessage: 'Tabs Permissions'
                    }),
                    children: TAB_LABELS.map((tabLabel)=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.Tabs.Trigger, {
                            value: tabLabel.id,
                            children: formatMessage({
                                id: tabLabel.labelId,
                                defaultMessage: tabLabel.defaultMessage
                            })
                        }, tabLabel.id))
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tabs.Content, {
                    value: TAB_LABELS[0].id,
                    children: /*#__PURE__*/ jsxRuntime.jsx(ContentTypes.ContentTypes, {
                        layout: layouts.collectionTypes,
                        kind: "collectionTypes",
                        isFormDisabled: isFormDisabled
                    })
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tabs.Content, {
                    value: TAB_LABELS[1].id,
                    children: /*#__PURE__*/ jsxRuntime.jsx(ContentTypes.ContentTypes, {
                        layout: layouts.singleTypes,
                        kind: "singleTypes",
                        isFormDisabled: isFormDisabled
                    })
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tabs.Content, {
                    value: TAB_LABELS[2].id,
                    children: /*#__PURE__*/ jsxRuntime.jsx(PluginsAndSettings.PluginsAndSettingsPermissions, {
                        layout: layouts.plugins,
                        kind: "plugins",
                        isFormDisabled: isFormDisabled
                    })
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tabs.Content, {
                    value: TAB_LABELS[3].id,
                    children: /*#__PURE__*/ jsxRuntime.jsx(PluginsAndSettings.PluginsAndSettingsPermissions, {
                        layout: layouts.settings,
                        kind: "settings",
                        isFormDisabled: isFormDisabled
                    })
                })
            ]
        })
    });
});
const initialState = {
    initialData: {},
    modifiedData: {},
    layouts: {}
};
/* eslint-disable consistent-return */ const reducer = (state, action)=>immer.produce(state, (draftState)=>{
        switch(action.type){
            // This action is called when a checkbox in the <GlobalActions />
            // changes
            case 'ON_CHANGE_COLLECTION_TYPE_GLOBAL_ACTION_CHECKBOX':
                {
                    const { collectionTypeKind, actionId, value } = action;
                    const pathToData = [
                        'modifiedData',
                        collectionTypeKind
                    ];
                    Object.keys(get(state, pathToData)).forEach((collectionType)=>{
                        const collectionTypeActionData = get(state, [
                            ...pathToData,
                            collectionType,
                            actionId
                        ], undefined);
                        if (collectionTypeActionData) {
                            let updatedValues = updateValues.updateValues(collectionTypeActionData, value);
                            // We need to remove the applied conditions
                            // @ts-expect-error – TODO: type better
                            if (!value && updatedValues.conditions) {
                                // @ts-expect-error – TODO: type better
                                const updatedConditions = updateValues.updateValues(updatedValues.conditions, false);
                                updatedValues = {
                                    ...updatedValues,
                                    conditions: updatedConditions
                                };
                            }
                            set(draftState, [
                                ...pathToData,
                                collectionType,
                                actionId
                            ], updatedValues);
                        }
                    });
                    break;
                }
            case 'ON_CHANGE_COLLECTION_TYPE_ROW_LEFT_CHECKBOX':
                {
                    const { pathToCollectionType, propertyName, rowName, value } = action;
                    let nextModifiedDataState = cloneDeep(state.modifiedData);
                    const pathToModifiedDataCollectionType = pathToCollectionType.split('..');
                    const objToUpdate = get(nextModifiedDataState, pathToModifiedDataCollectionType, {});
                    Object.keys(objToUpdate).forEach((actionId)=>{
                        // When a ct has multiple properties (ex: locales, field)
                        // We need to make sure that we add any new property to the modifiedData
                        // object.
                        if (has(objToUpdate[actionId], `properties.${propertyName}`)) {
                            const objValue = get(objToUpdate, [
                                actionId,
                                'properties',
                                propertyName,
                                rowName
                            ]);
                            const pathToDataToSet = [
                                ...pathToModifiedDataCollectionType,
                                actionId,
                                'properties',
                                propertyName,
                                rowName
                            ];
                            if (!objects.isObject(objValue)) {
                                set(nextModifiedDataState, pathToDataToSet, value);
                            } else {
                                const updatedValue = updateValues.updateValues(objValue, value);
                                set(nextModifiedDataState, pathToDataToSet, updatedValue);
                            }
                        }
                    });
                    // When we uncheck a row, we need to check if we also need to disable the conditions
                    if (!value) {
                        // @ts-expect-error – TODO: type better
                        nextModifiedDataState = updateConditionsToFalse.updateConditionsToFalse(nextModifiedDataState);
                    }
                    set(draftState, 'modifiedData', nextModifiedDataState);
                    break;
                }
            case 'ON_CHANGE_CONDITIONS':
                {
                    Object.entries(action.conditions).forEach((array)=>{
                        const [stringPathToData, conditionsToUpdate] = array;
                        set(draftState, [
                            'modifiedData',
                            ...stringPathToData.split('..'),
                            'conditions'
                        ], conditionsToUpdate);
                    });
                    break;
                }
            case 'ON_CHANGE_SIMPLE_CHECKBOX':
                {
                    let nextModifiedDataState = cloneDeep(state.modifiedData);
                    set(nextModifiedDataState, [
                        ...action.keys.split('..')
                    ], action.value);
                    // When we uncheck a single checkbox we need to remove the conditions from the parent
                    if (!action.value) {
                        // @ts-expect-error – TODO: type better
                        nextModifiedDataState = updateConditionsToFalse.updateConditionsToFalse(nextModifiedDataState);
                    }
                    set(draftState, 'modifiedData', nextModifiedDataState);
                    break;
                }
            /*
       * Here the idea is to retrieve a specific value of the modifiedObject
       * then update all the boolean values of the retrieved one
       * and update the drafState.
       *
       * For instance in order to enable create action for all the fields and locales
       * of the restaurant content type we need to :
       * 1. Retrieve the modifiedData.collectionTypes.restaurant.create object
       * 2. Toggle all the end boolean values to the desired one
       * 3. Update the draftState
       *
       * Since the case works well in order to update what we called "parent" checkbox. We can
       * reuse the action when we need to toggle change all the values that depends on this one.
       * A parent checkbox is a checkbox which value is not a boolean but depends on its children ones, therefore,
       * a parent checkbox does not have a represented value in the draftState, they are just helpers.
       *
       * Given the following data:
       *
       * const data = {
       *  restaurant: {
       *   create: {
       *     fields: { name: true },
       *     locales: { en: false }
       *   }
       *  }
       * }
       *
       * The value of the create checkbox for the restaurant will be ƒalse since not all its children have
       * truthy values and in order to set its value to true when need to have all the values of its children set to true.
       *
       * Similarly, we can reuse the logic for the components attributes
       *
       */ case 'ON_CHANGE_TOGGLE_PARENT_CHECKBOX':
                {
                    const { keys, value } = action;
                    const pathToValue = [
                        ...keys.split('..')
                    ];
                    let nextModifiedDataState = cloneDeep(state.modifiedData);
                    const oldValues = get(nextModifiedDataState, pathToValue, {});
                    const updatedValues = updateValues.updateValues(oldValues, value);
                    set(nextModifiedDataState, pathToValue, updatedValues);
                    // When we uncheck a parent checkbox we need to remove the associated conditions
                    if (!value) {
                        // @ts-expect-error – TODO: type better
                        nextModifiedDataState = updateConditionsToFalse.updateConditionsToFalse(nextModifiedDataState);
                    }
                    set(draftState, [
                        'modifiedData'
                    ], nextModifiedDataState);
                    break;
                }
            case 'RESET_FORM':
                {
                    draftState.modifiedData = state.initialData;
                    break;
                }
            case 'SET_FORM_AFTER_SUBMIT':
                {
                    draftState.initialData = state.modifiedData;
                    break;
                }
            default:
                return draftState;
        }
    });
/* -------------------------------------------------------------------------------------------------
 * init (reducer)
 * -----------------------------------------------------------------------------------------------*/ const init = (layout, permissions)=>{
    const { conditions, sections: { collectionTypes, singleTypes, plugins, settings } } = layout;
    const layouts$1 = {
        collectionTypes,
        singleTypes,
        plugins: layouts.formatLayout(plugins, 'plugin'),
        settings: layouts.formatLayout(settings, 'category')
    };
    const defaultForm = {
        collectionTypes: forms.createDefaultCTForm(collectionTypes, conditions, permissions),
        singleTypes: forms.createDefaultCTForm(singleTypes, conditions, permissions),
        plugins: forms.createDefaultForm(layouts$1.plugins, conditions, permissions),
        settings: forms.createDefaultForm(layouts$1.settings, conditions, permissions)
    };
    return {
        initialData: defaultForm,
        modifiedData: defaultForm,
        layouts: layouts$1
    };
};

exports.Permissions = Permissions;
//# sourceMappingURL=Permissions.js.map
