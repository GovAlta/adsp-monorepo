import { jsx, Fragment, jsxs } from 'react/jsx-runtime';
import * as React from 'react';
import { Flex, Box, Checkbox, Modal } from '@strapi/design-system';
import { ChevronUp, ChevronDown } from '@strapi/icons';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import omit from 'lodash/omit';
import { useIntl } from 'react-intl';
import { styled } from 'styled-components';
import { capitalise } from '../../../../../utils/strings.mjs';
import { usePermissionsDataManager } from '../hooks/usePermissionsDataManager.mjs';
import { cellWidth, rowHeight } from '../utils/constants.mjs';
import { createArrayOfValues } from '../utils/createArrayOfValues.mjs';
import { getCheckboxState } from '../utils/getCheckboxState.mjs';
import { CollapsePropertyMatrix } from './CollapsePropertyMatrix.mjs';
import { ConditionsButton } from './ConditionsButton.mjs';
import { ConditionsModal } from './ConditionsModal.mjs';
import { HiddenAction } from './HiddenAction.mjs';
import { RowLabelWithCheckbox } from './RowLabelWithCheckbox.mjs';

const ContentTypeCollapses = ({ actions = [], isFormDisabled, pathToData, subjects = [] })=>{
    const [collapseToOpen, setCollapseToOpen] = React.useState(null);
    const handleClickToggleCollapse = (collapseName)=>()=>{
            const nextCollapseToOpen = collapseToOpen === collapseName ? null : collapseName;
            setCollapseToOpen(nextCollapseToOpen);
        };
    return /*#__PURE__*/ jsx(Fragment, {
        children: subjects.map(({ uid, label, properties }, index)=>{
            const isActive = collapseToOpen === uid;
            const availableActions = actions.map((action)=>({
                    ...action,
                    isDisplayed: Array.isArray(action.subjects) && action.subjects.indexOf(uid) !== -1
                }));
            return /*#__PURE__*/ jsxs(Flex, {
                direction: "column",
                display: "inline-flex",
                alignItems: "stretch",
                minWidth: "100%",
                borderColor: isActive ? 'primary600' : undefined,
                children: [
                    /*#__PURE__*/ jsx(Collapse, {
                        availableActions: availableActions,
                        isActive: isActive,
                        isGrey: index % 2 === 0,
                        isFormDisabled: isFormDisabled,
                        label: label,
                        onClickToggle: handleClickToggleCollapse(uid),
                        pathToData: [
                            pathToData,
                            uid
                        ].join('..')
                    }),
                    isActive && properties.map(({ label: propertyLabel, value, children: childrenForm })=>{
                        return /*#__PURE__*/ jsx(CollapsePropertyMatrix, {
                            availableActions: availableActions,
                            childrenForm: childrenForm,
                            isFormDisabled: isFormDisabled,
                            label: propertyLabel,
                            pathToData: [
                                pathToData,
                                uid
                            ].join('..'),
                            propertyName: value
                        }, value);
                    })
                ]
            }, uid);
        })
    });
};
const Collapse = ({ availableActions = [], isActive = false, isGrey = false, isFormDisabled = false, label, onClickToggle, pathToData })=>{
    const { formatMessage } = useIntl();
    const { modifiedData, onChangeParentCheckbox, onChangeSimpleCheckbox } = usePermissionsDataManager();
    const [isConditionModalOpen, setIsConditionModalOpen] = React.useState(false);
    // This corresponds to the data related to the CT left checkbox
    // modifiedData: { collectionTypes: { [ctuid]: {create: {properties: { fields: {f1: true} }, update: {}, ... } } } }
    const mainData = get(modifiedData, pathToData.split('..'), {});
    // The utils we are using: getCheckboxState, retrieves all the boolean leafs of an object in order
    // to return the state of checkbox. Since the conditions are not related to the property we need to remove the key from the object.
    const dataWithoutCondition = React.useMemo(()=>{
        return Object.keys(mainData).reduce((acc, current)=>{
            acc[current] = omit(mainData[current], 'conditions');
            return acc;
        }, {});
    }, [
        mainData
    ]);
    const { hasAllActionsSelected, hasSomeActionsSelected } = getCheckboxState(dataWithoutCondition);
    // Here we create an array of <checkbox>, since the state of each one of them is used in
    // order to know if whether or not we need to display the associated action in
    // the <ConditionsModal />
    const checkboxesActions = React.useMemo(()=>{
        return generateCheckboxesActions(availableActions, modifiedData, pathToData);
    }, [
        availableActions,
        modifiedData,
        pathToData
    ]);
    // @ts-expect-error – hasConditions does not exist on all versions of checkboxesActions.
    const doesConditionButtonHasConditions = checkboxesActions.some((action)=>action.hasConditions);
    return /*#__PURE__*/ jsxs(BoxWrapper, {
        $isActive: isActive,
        children: [
            /*#__PURE__*/ jsxs(Wrapper, {
                height: rowHeight,
                flex: 1,
                alignItems: "center",
                background: isGrey ? 'neutral100' : 'neutral0',
                children: [
                    /*#__PURE__*/ jsx(RowLabelWithCheckbox, {
                        isCollapsable: true,
                        isFormDisabled: isFormDisabled,
                        label: capitalise(label),
                        checkboxName: pathToData,
                        onChange: onChangeParentCheckbox,
                        onClick: onClickToggle,
                        someChecked: hasSomeActionsSelected,
                        value: hasAllActionsSelected,
                        isActive: isActive,
                        children: /*#__PURE__*/ jsx(Chevron, {
                            paddingLeft: 2,
                            children: isActive ? /*#__PURE__*/ jsx(ChevronUp, {}) : /*#__PURE__*/ jsx(ChevronDown, {})
                        })
                    }),
                    /*#__PURE__*/ jsx(Flex, {
                        style: {
                            flex: 1
                        },
                        children: checkboxesActions.map(({ actionId, hasSomeActionsSelected, isDisplayed, ...restAction })=>{
                            if (!isDisplayed) {
                                return /*#__PURE__*/ jsx(HiddenAction, {}, actionId);
                            }
                            const { hasConditions, hasAllActionsSelected, isParentCheckbox, checkboxName, label: permissionLabel } = restAction;
                            if (isParentCheckbox) {
                                return /*#__PURE__*/ jsx(Cell, {
                                    justifyContent: "center",
                                    alignItems: "center",
                                    children: /*#__PURE__*/ jsxs(Box, {
                                        position: "relative",
                                        zIndex: 1,
                                        children: [
                                            hasConditions && /*#__PURE__*/ jsx(Box, {
                                                tag: "span",
                                                position: "absolute",
                                                top: "-6px",
                                                left: "37px",
                                                width: "6px",
                                                height: "6px",
                                                borderRadius: "20px",
                                                background: "primary600"
                                            }),
                                            /*#__PURE__*/ jsx(Checkbox, {
                                                disabled: isFormDisabled,
                                                name: checkboxName,
                                                "aria-label": formatMessage({
                                                    id: `Settings.permissions.select-by-permission`,
                                                    defaultMessage: 'Select {label} permission'
                                                }, {
                                                    label: `${permissionLabel} ${label}`
                                                }),
                                                // Keep same signature as packages/core/admin/admin/src/components/Roles/Permissions/index.js l.91
                                                onCheckedChange: (value)=>{
                                                    onChangeParentCheckbox({
                                                        target: {
                                                            name: checkboxName,
                                                            value: !!value
                                                        }
                                                    });
                                                },
                                                checked: hasSomeActionsSelected ? 'indeterminate' : hasAllActionsSelected
                                            })
                                        ]
                                    })
                                }, actionId);
                            }
                            return /*#__PURE__*/ jsxs(Cell, {
                                justifyContent: "center",
                                alignItems: "center",
                                children: [
                                    hasConditions && /*#__PURE__*/ jsx(Box, {
                                        tag: "span",
                                        position: "absolute",
                                        top: "-6px",
                                        left: "37px",
                                        width: "6px",
                                        height: "6px",
                                        borderRadius: "20px",
                                        background: "primary600"
                                    }),
                                    /*#__PURE__*/ jsx(Checkbox, {
                                        disabled: isFormDisabled,
                                        name: checkboxName,
                                        // Keep same signature as packages/core/admin/admin/src/components/Roles/Permissions/index.js l.91
                                        onCheckedChange: (value)=>{
                                            onChangeSimpleCheckbox({
                                                target: {
                                                    name: checkboxName,
                                                    value: !!value
                                                }
                                            });
                                        },
                                        checked: hasConditions ? 'indeterminate' : hasAllActionsSelected
                                    })
                                ]
                            }, actionId);
                        })
                    })
                ]
            }),
            /*#__PURE__*/ jsx(Box, {
                bottom: "10px",
                right: "9px",
                position: "absolute",
                children: /*#__PURE__*/ jsxs(Modal.Root, {
                    open: isConditionModalOpen,
                    onOpenChange: ()=>{
                        setIsConditionModalOpen((prev)=>!prev);
                    },
                    children: [
                        /*#__PURE__*/ jsx(Modal.Trigger, {
                            children: /*#__PURE__*/ jsx(ConditionsButton, {
                                hasConditions: doesConditionButtonHasConditions
                            })
                        }),
                        /*#__PURE__*/ jsx(ConditionsModal, {
                            headerBreadCrumbs: [
                                label,
                                'Settings.permissions.conditions.conditions'
                            ],
                            actions: checkboxesActions,
                            isFormDisabled: isFormDisabled,
                            onClose: ()=>{
                                setIsConditionModalOpen(false);
                            }
                        })
                    ]
                })
            })
        ]
    });
};
const generateCheckboxesActions = (availableActions, modifiedData, pathToData)=>{
    return availableActions.map(({ actionId, isDisplayed, applyToProperties, label })=>{
        if (!isDisplayed) {
            return {
                actionId,
                hasSomeActionsSelected: false,
                isDisplayed
            };
        }
        const baseCheckboxNameArray = [
            ...pathToData.split('..'),
            actionId
        ];
        const checkboxNameArray = isEmpty(applyToProperties) ? [
            ...baseCheckboxNameArray,
            'properties',
            'enabled'
        ] : baseCheckboxNameArray;
        const conditionsValue = get(modifiedData, [
            ...baseCheckboxNameArray,
            'conditions'
        ], null);
        const baseCheckboxAction = {
            actionId,
            checkboxName: checkboxNameArray.join('..'),
            hasConditions: createArrayOfValues(conditionsValue).some((val)=>val),
            isDisplayed,
            label,
            pathToConditionsObject: baseCheckboxNameArray
        };
        if (isEmpty(applyToProperties)) {
            const value = get(modifiedData, checkboxNameArray, false);
            // Since applyToProperties is empty it is not a parent checkbox, therefore hasAllActionsSelected is
            // equal to hasSomeActionsSelected
            return {
                ...baseCheckboxAction,
                hasAllActionsSelected: value,
                hasSomeActionsSelected: value,
                isParentCheckbox: false
            };
        }
        const mainData = get(modifiedData, checkboxNameArray, null);
        const { hasAllActionsSelected, hasSomeActionsSelected } = getCheckboxState(mainData);
        return {
            ...baseCheckboxAction,
            hasAllActionsSelected,
            hasSomeActionsSelected,
            isParentCheckbox: true
        };
    });
};
const activeRowStyle = (theme, isActive)=>`
  ${Wrapper} {
    background-color: ${theme.colors.primary100};
    color: ${theme.colors.primary600};
    border-radius: ${isActive ? '2px 2px 0 0' : '2px'};
    font-weight: ${theme.fontWeights.bold};
  }

  ${Chevron} {
    display: flex;
  }
  ${ConditionsButton} {
    display: block;
  }

  &:focus-within {
    ${()=>activeRowStyle(theme, isActive)}
  }
`;
const Wrapper = styled(Flex)`
  border: 1px solid transparent;
`;
const BoxWrapper = styled.div`
  display: inline-flex;
  min-width: 100%;
  position: relative;

  ${ConditionsButton} {
    display: none;
  }

  ${({ $isActive, theme })=>$isActive && activeRowStyle(theme, $isActive)}

  &:hover {
    ${({ theme, $isActive })=>activeRowStyle(theme, $isActive)}
  }
`;
const Cell = styled(Flex)`
  width: ${cellWidth};
  position: relative;
`;
const Chevron = styled(Box)`
  display: none;

  svg {
    width: 1.4rem;
  }

  path {
    fill: ${({ theme })=>theme.colors.primary600};
  }
`;

export { ContentTypeCollapses };
//# sourceMappingURL=ContentTypeCollapses.mjs.map
