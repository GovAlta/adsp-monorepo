import { jsx, jsxs } from 'react/jsx-runtime';
import * as React from 'react';
import { Box, Flex, Typography, Checkbox } from '@strapi/design-system';
import get from 'lodash/get';
import { useIntl } from 'react-intl';
import { usePermissionsDataManager } from '../hooks/usePermissionsDataManager.mjs';
import { firstRowWidth, cellWidth } from '../utils/constants.mjs';
import { getCheckboxState } from '../utils/getCheckboxState.mjs';
import { removeConditionKeyFromData } from '../utils/removeConditionKeyFromData.mjs';

const GlobalActions = ({ actions = [], isFormDisabled, kind })=>{
    const { formatMessage } = useIntl();
    const { modifiedData, onChangeCollectionTypeGlobalActionCheckbox } = usePermissionsDataManager();
    const displayedActions = actions.filter(({ subjects })=>subjects && subjects.length);
    const checkboxesState = React.useMemo(()=>{
        const actionsIds = displayedActions.map(({ actionId })=>actionId);
        const data = modifiedData[kind];
        const relatedActionsData = actionsIds.reduce((acc, actionId)=>{
            Object.keys(data).forEach((ctUid)=>{
                const actionIdData = get(data, [
                    ctUid,
                    actionId
                ]);
                const actionIdState = {
                    [ctUid]: removeConditionKeyFromData(actionIdData)
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
            acc[current] = getCheckboxState(relatedActionsData[current]);
            return acc;
        }, {});
        return checkboxesState;
    }, [
        modifiedData,
        displayedActions,
        kind
    ]);
    return /*#__PURE__*/ jsx(Box, {
        paddingBottom: 4,
        paddingTop: 6,
        style: {
            paddingLeft: firstRowWidth
        },
        children: /*#__PURE__*/ jsx(Flex, {
            gap: 0,
            children: displayedActions.map(({ label, actionId })=>{
                return /*#__PURE__*/ jsxs(Flex, {
                    shrink: 0,
                    width: cellWidth,
                    direction: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 3,
                    children: [
                        /*#__PURE__*/ jsx(Typography, {
                            variant: "sigma",
                            textColor: "neutral500",
                            children: formatMessage({
                                id: `Settings.roles.form.permissions.${label.toLowerCase()}`,
                                defaultMessage: label
                            })
                        }),
                        /*#__PURE__*/ jsx(Checkbox, {
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

export { GlobalActions };
//# sourceMappingURL=GlobalActions.mjs.map
