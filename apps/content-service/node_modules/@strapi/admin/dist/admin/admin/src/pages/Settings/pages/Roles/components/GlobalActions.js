'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var get = require('lodash/get');
var reactIntl = require('react-intl');
var usePermissionsDataManager = require('../hooks/usePermissionsDataManager.js');
var constants = require('../utils/constants.js');
var getCheckboxState = require('../utils/getCheckboxState.js');
var removeConditionKeyFromData = require('../utils/removeConditionKeyFromData.js');

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

const GlobalActions = ({ actions = [], isFormDisabled, kind })=>{
    const { formatMessage } = reactIntl.useIntl();
    const { modifiedData, onChangeCollectionTypeGlobalActionCheckbox } = usePermissionsDataManager.usePermissionsDataManager();
    const displayedActions = actions.filter(({ subjects })=>subjects && subjects.length);
    const checkboxesState = React__namespace.useMemo(()=>{
        const actionsIds = displayedActions.map(({ actionId })=>actionId);
        const data = modifiedData[kind];
        const relatedActionsData = actionsIds.reduce((acc, actionId)=>{
            Object.keys(data).forEach((ctUid)=>{
                const actionIdData = get(data, [
                    ctUid,
                    actionId
                ]);
                const actionIdState = {
                    [ctUid]: removeConditionKeyFromData.removeConditionKeyFromData(actionIdData)
                };
                if (!acc[actionId]) {
                    acc[actionId] = actionIdState;
                } else {
                    acc[actionId] = {
                        ...acc[actionId],
                        ...actionIdState
                    };
                }
            });
            return acc;
        }, {});
        const checkboxesState = Object.keys(relatedActionsData).reduce((acc, current)=>{
            acc[current] = getCheckboxState.getCheckboxState(relatedActionsData[current]);
            return acc;
        }, {});
        return checkboxesState;
    }, [
        modifiedData,
        displayedActions,
        kind
    ]);
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
        paddingBottom: 4,
        paddingTop: 6,
        style: {
            paddingLeft: constants.firstRowWidth
        },
        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
            gap: 0,
            children: displayedActions.map(({ label, actionId })=>{
                return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                    shrink: 0,
                    width: constants.cellWidth,
                    direction: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 3,
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                            variant: "sigma",
                            textColor: "neutral500",
                            children: formatMessage({
                                id: `Settings.roles.form.permissions.${label.toLowerCase()}`,
                                defaultMessage: label
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Checkbox, {
                            disabled: isFormDisabled,
                            onCheckedChange: (value)=>{
                                onChangeCollectionTypeGlobalActionCheckbox(kind, actionId, !!value);
                            },
                            name: actionId,
                            "aria-label": formatMessage({
                                id: `Settings.permissions.select-all-by-permission`,
                                defaultMessage: 'Select all {label} permissions'
                            }, {
                                label: formatMessage({
                                    id: `Settings.roles.form.permissions.${label.toLowerCase()}`,
                                    defaultMessage: label
                                })
                            }),
                            checked: get(checkboxesState, [
                                actionId,
                                'hasSomeActionsSelected'
                            ], false) ? 'indeterminate' : get(checkboxesState, [
                                actionId,
                                'hasAllActionsSelected'
                            ], false)
                        })
                    ]
                }, actionId);
            })
        })
    });
};

exports.GlobalActions = GlobalActions;
//# sourceMappingURL=GlobalActions.js.map
