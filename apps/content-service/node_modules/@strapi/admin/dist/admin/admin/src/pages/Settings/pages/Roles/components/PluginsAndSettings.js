'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var get = require('lodash/get');
var reactIntl = require('react-intl');
var styled = require('styled-components');
var strings = require('../../../../../utils/strings.js');
var usePermissionsDataManager = require('../hooks/usePermissionsDataManager.js');
var createArrayOfValues = require('../utils/createArrayOfValues.js');
var getCheckboxState = require('../utils/getCheckboxState.js');
var removeConditionKeyFromData = require('../utils/removeConditionKeyFromData.js');
var ConditionsButton = require('./ConditionsButton.js');
var ConditionsModal = require('./ConditionsModal.js');

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

const PluginsAndSettingsPermissions = ({ layout, ...restProps })=>{
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
        padding: 6,
        background: "neutral0",
        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Accordion.Root, {
            size: "M",
            children: layout.map(({ category, categoryId, childrenForm }, index)=>{
                return /*#__PURE__*/ jsxRuntime.jsx(Row, {
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
    const { formatMessage } = reactIntl.useIntl();
    const categoryName = name.split('::').pop() ?? '';
    const categoryDisplayName = categoryName === 'upload' ? 'Media Library' : strings.capitalise(categoryName.replace(/-/g, ' '));
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Accordion.Item, {
        value: name,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Accordion.Header, {
                variant: variant,
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Accordion.Trigger, {
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
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Accordion.Content, {
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                    padding: 6,
                    children: childrenForm.map(({ actions, subCategoryName, subCategoryId })=>/*#__PURE__*/ jsxRuntime.jsx(SubCategory, {
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
    const { modifiedData, onChangeParentCheckbox, onChangeSimpleCheckbox } = usePermissionsDataManager.usePermissionsDataManager();
    const [isConditionModalOpen, setIsConditionModalOpen] = React__namespace.useState(false);
    const { formatMessage } = reactIntl.useIntl();
    const mainData = get(modifiedData, pathToData, {});
    const dataWithoutCondition = React__namespace.useMemo(()=>{
        return Object.keys(mainData).reduce((acc, current)=>{
            acc[current] = removeConditionKeyFromData.removeConditionKeyFromData(mainData[current]);
            return acc;
        }, {});
    }, [
        mainData
    ]);
    const { hasAllActionsSelected, hasSomeActionsSelected } = getCheckboxState.getCheckboxState(dataWithoutCondition);
    // We need to format the actions so it matches the shape of the ConditionsModal actions props
    const formattedActions = React__namespace.useMemo(()=>{
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
            const hasConditions = createArrayOfValues.createArrayOfValues(conditionValue).some((val)=>val);
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
    const doesButtonHasCondition = createArrayOfValues.createArrayOfValues(Object.entries(datum).reduce((acc, current)=>{
        const [catName, { conditions }] = current;
        acc[catName] = conditions;
        return acc;
    }, {})).some((val)=>val);
    return /*#__PURE__*/ jsxRuntime.jsx(jsxRuntime.Fragment, {
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Box, {
            children: [
                /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                    justifyContent: "space-between",
                    alignItems: "center",
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                            paddingRight: 4,
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                variant: "sigma",
                                textColor: "neutral600",
                                children: subCategoryName
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(Border, {
                            flex: 1
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                            paddingLeft: 4,
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Checkbox, {
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
                /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                    paddingTop: 6,
                    paddingBottom: 6,
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Root, {
                            gap: 2,
                            style: {
                                flex: 1
                            },
                            children: formattedActions.map(({ checkboxName, value, action, displayName, hasConditions })=>{
                                return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                                    col: 3,
                                    direction: "column",
                                    alignItems: "start",
                                    children: /*#__PURE__*/ jsxRuntime.jsx(CheckboxWrapper, {
                                        $disabled: isFormDisabled,
                                        $hasConditions: hasConditions,
                                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Checkbox, {
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
                        /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Modal.Root, {
                            open: isConditionModalOpen,
                            onOpenChange: ()=>{
                                setIsConditionModalOpen((prev)=>!prev);
                            },
                            children: [
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Trigger, {
                                    children: /*#__PURE__*/ jsxRuntime.jsx(ConditionsButton.ConditionsButton, {
                                        hasConditions: doesButtonHasCondition
                                    })
                                }),
                                /*#__PURE__*/ jsxRuntime.jsx(ConditionsModal.ConditionsModal, {
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
const Border = styled.styled(designSystem.Box)`
  align-self: center;
  border-top: 1px solid ${({ theme })=>theme.colors.neutral150};
`;
const CheckboxWrapper = styled.styled.div`
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

exports.PluginsAndSettingsPermissions = PluginsAndSettingsPermissions;
//# sourceMappingURL=PluginsAndSettings.js.map
