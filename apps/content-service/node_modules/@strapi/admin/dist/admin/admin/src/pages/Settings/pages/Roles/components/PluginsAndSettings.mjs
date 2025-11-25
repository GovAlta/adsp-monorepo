import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import * as React from 'react';
import { Box, Accordion, Flex, Typography, Checkbox, Grid, Modal } from '@strapi/design-system';
import get from 'lodash/get';
import { useIntl } from 'react-intl';
import { styled } from 'styled-components';
import { capitalise } from '../../../../../utils/strings.mjs';
import { usePermissionsDataManager } from '../hooks/usePermissionsDataManager.mjs';
import { createArrayOfValues } from '../utils/createArrayOfValues.mjs';
import { getCheckboxState } from '../utils/getCheckboxState.mjs';
import { removeConditionKeyFromData } from '../utils/removeConditionKeyFromData.mjs';
import { ConditionsButton } from './ConditionsButton.mjs';
import { ConditionsModal } from './ConditionsModal.mjs';

const PluginsAndSettingsPermissions = ({ layout, ...restProps })=>{
    return /*#__PURE__*/ jsx(Box, {
        padding: 6,
        background: "neutral0",
        children: /*#__PURE__*/ jsx(Accordion.Root, {
            size: "M",
            children: layout.map(({ category, categoryId, childrenForm }, index)=>{
                return /*#__PURE__*/ jsx(Row, {
                    childrenForm: childrenForm,
                    variant: index % 2 === 1 ? 'primary' : 'secondary',
                    name: category,
                    pathToData: [
                        restProps.kind,
                        categoryId
                    ],
                    ...restProps
                }, category);
            })
        })
    });
};
const Row = ({ childrenForm, kind, name, isFormDisabled = false, variant, pathToData })=>{
    const { formatMessage } = useIntl();
    const categoryName = name.split('::').pop() ?? '';
    const categoryDisplayName = categoryName === 'upload' ? 'Media Library' : capitalise(categoryName.replace(/-/g, ' '));
    return /*#__PURE__*/ jsxs(Accordion.Item, {
        value: name,
        children: [
            /*#__PURE__*/ jsx(Accordion.Header, {
                variant: variant,
                children: /*#__PURE__*/ jsx(Accordion.Trigger, {
                    caretPosition: "right",
                    description: `${formatMessage({
                        id: 'Settings.permissions.category',
                        defaultMessage: categoryName
                    }, {
                        category: categoryName
                    })} ${kind === 'plugins' ? 'plugin' : kind}`,
                    children: categoryDisplayName
                })
            }),
            /*#__PURE__*/ jsx(Accordion.Content, {
                children: /*#__PURE__*/ jsx(Box, {
                    padding: 6,
                    children: childrenForm.map(({ actions, subCategoryName, subCategoryId })=>/*#__PURE__*/ jsx(SubCategory, {
                            actions: actions,
                            categoryName: categoryName,
                            isFormDisabled: isFormDisabled,
                            subCategoryName: subCategoryName,
                            pathToData: [
                                ...pathToData,
                                subCategoryId
                            ]
                        }, subCategoryName))
                })
            })
        ]
    });
};
const SubCategory = ({ actions = [], categoryName, isFormDisabled, subCategoryName, pathToData })=>{
    const { modifiedData, onChangeParentCheckbox, onChangeSimpleCheckbox } = usePermissionsDataManager();
    const [isConditionModalOpen, setIsConditionModalOpen] = React.useState(false);
    const { formatMessage } = useIntl();
    const mainData = get(modifiedData, pathToData, {});
    const dataWithoutCondition = React.useMemo(()=>{
        return Object.keys(mainData).reduce((acc, current)=>{
            acc[current] = removeConditionKeyFromData(mainData[current]);
            return acc;
        }, {});
    }, [
        mainData
    ]);
    const { hasAllActionsSelected, hasSomeActionsSelected } = getCheckboxState(dataWithoutCondition);
    // We need to format the actions so it matches the shape of the ConditionsModal actions props
    const formattedActions = React.useMemo(()=>{
        return actions.map((action)=>{
            const checkboxName = [
                ...pathToData,
                action.action,
                'properties',
                'enabled'
            ];
            const checkboxValue = get(modifiedData, checkboxName, false);
            const conditionValue = get(modifiedData, [
                ...pathToData,
                action.action,
                'conditions'
            ], {});
            const hasConditions = createArrayOfValues(conditionValue).some((val)=>val);
            return {
                ...action,
                isDisplayed: checkboxValue,
                checkboxName: checkboxName.join('..'),
                hasSomeActionsSelected: checkboxValue,
                value: checkboxValue,
                hasConditions,
                label: action.displayName,
                actionId: action.action,
                pathToConditionsObject: [
                    ...pathToData,
                    action.action
                ]
            };
        });
    }, [
        actions,
        modifiedData,
        pathToData
    ]);
    const datum = get(modifiedData, [
        ...pathToData
    ], {});
    const doesButtonHasCondition = createArrayOfValues(Object.entries(datum).reduce((acc, current)=>{
        const [catName, { conditions }] = current;
        acc[catName] = conditions;
        return acc;
    }, {})).some((val)=>val);
    return /*#__PURE__*/ jsx(Fragment, {
        children: /*#__PURE__*/ jsxs(Box, {
            children: [
                /*#__PURE__*/ jsxs(Flex, {
                    justifyContent: "space-between",
                    alignItems: "center",
                    children: [
                        /*#__PURE__*/ jsx(Box, {
                            paddingRight: 4,
                            children: /*#__PURE__*/ jsx(Typography, {
                                variant: "sigma",
                                textColor: "neutral600",
                                children: subCategoryName
                            })
                        }),
                        /*#__PURE__*/ jsx(Border, {
                            flex: 1
                        }),
                        /*#__PURE__*/ jsx(Box, {
                            paddingLeft: 4,
                            children: /*#__PURE__*/ jsx(Checkbox, {
                                name: pathToData.join('..'),
                                disabled: isFormDisabled,
                                // Keep same signature as packages/core/admin/admin/src/components/Roles/Permissions/index.js l.91
                                onCheckedChange: (value)=>{
                                    onChangeParentCheckbox({
                                        target: {
                                            name: pathToData.join('..'),
                                            value: !!value
                                        }
                                    });
                                },
                                checked: hasSomeActionsSelected ? 'indeterminate' : hasAllActionsSelected,
                                children: formatMessage({
                                    id: 'app.utils.select-all',
                                    defaultMessage: 'Select all'
                                })
                            })
                        })
                    ]
                }),
                /*#__PURE__*/ jsxs(Flex, {
                    paddingTop: 6,
                    paddingBottom: 6,
                    children: [
                        /*#__PURE__*/ jsx(Grid.Root, {
                            gap: 2,
                            style: {
                                flex: 1
                            },
                            children: formattedActions.map(({ checkboxName, value, action, displayName, hasConditions })=>{
                                return /*#__PURE__*/ jsx(Grid.Item, {
                                    col: 3,
                                    direction: "column",
                                    alignItems: "start",
                                    children: /*#__PURE__*/ jsx(CheckboxWrapper, {
                                        $disabled: isFormDisabled,
                                        $hasConditions: hasConditions,
                                        children: /*#__PURE__*/ jsx(Checkbox, {
                                            name: checkboxName,
                                            disabled: isFormDisabled,
                                            // Keep same signature as packages/core/admin/admin/src/components/Roles/Permissions/index.js l.91
                                            onCheckedChange: (value)=>{
                                                onChangeSimpleCheckbox({
                                                    target: {
                                                        name: checkboxName,
                                                        value: !!value
                                                    }
                                                });
                                            },
                                            checked: value,
                                            children: displayName
                                        })
                                    })
                                }, action);
                            })
                        }),
                        /*#__PURE__*/ jsxs(Modal.Root, {
                            open: isConditionModalOpen,
                            onOpenChange: ()=>{
                                setIsConditionModalOpen((prev)=>!prev);
                            },
                            children: [
                                /*#__PURE__*/ jsx(Modal.Trigger, {
                                    children: /*#__PURE__*/ jsx(ConditionsButton, {
                                        hasConditions: doesButtonHasCondition
                                    })
                                }),
                                /*#__PURE__*/ jsx(ConditionsModal, {
                                    headerBreadCrumbs: [
                                        categoryName,
                                        subCategoryName
                                    ],
                                    actions: formattedActions,
                                    isFormDisabled: isFormDisabled,
                                    onClose: ()=>{
                                        setIsConditionModalOpen(false);
                                    }
                                })
                            ]
                        })
                    ]
                })
            ]
        })
    });
};
const Border = styled(Box)`
  align-self: center;
  border-top: 1px solid ${({ theme })=>theme.colors.neutral150};
`;
const CheckboxWrapper = styled.div`
  position: relative;
  word-break: keep-all;
  ${({ $hasConditions, $disabled, theme })=>$hasConditions && `
    &:before {
      content: '';
      position: absolute;
      top: -0.4rem;
      left: -0.8rem;
      width: 0.6rem;
      height: 0.6rem;
      border-radius: 2rem;
      background: ${$disabled ? theme.colors.neutral100 : theme.colors.primary600};
    }
  `}
`;

export { PluginsAndSettingsPermissions };
//# sourceMappingURL=PluginsAndSettings.mjs.map
