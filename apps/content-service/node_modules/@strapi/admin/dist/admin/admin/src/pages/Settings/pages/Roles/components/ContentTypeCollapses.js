'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var get = require('lodash/get');
var isEmpty = require('lodash/isEmpty');
var omit = require('lodash/omit');
var reactIntl = require('react-intl');
var styled = require('styled-components');
var strings = require('../../../../../utils/strings.js');
var usePermissionsDataManager = require('../hooks/usePermissionsDataManager.js');
var constants = require('../utils/constants.js');
var createArrayOfValues = require('../utils/createArrayOfValues.js');
var getCheckboxState = require('../utils/getCheckboxState.js');
var CollapsePropertyMatrix = require('./CollapsePropertyMatrix.js');
var ConditionsButton = require('./ConditionsButton.js');
var ConditionsModal = require('./ConditionsModal.js');
var HiddenAction = require('./HiddenAction.js');
var RowLabelWithCheckbox = require('./RowLabelWithCheckbox.js');

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

const ContentTypeCollapses = ({ actions = [], isFormDisabled, pathToData, subjects = [] })=>{
    const [collapseToOpen, setCollapseToOpen] = React__namespace.useState(null);
    const handleClickToggleCollapse = (collapseName)=>()=>{
            const nextCollapseToOpen = collapseToOpen === collapseName ? null : collapseName;
            setCollapseToOpen(nextCollapseToOpen);
        };
    return /*#__PURE__*/ jsxRuntime.jsx(jsxRuntime.Fragment, {
        children: subjects.map(({ uid, label, properties }, index)=>{
            const isActive = collapseToOpen === uid;
            const availableActions = actions.map((action)=>({
                    ...action,
                    isDisplayed: Array.isArray(action.subjects) && action.subjects.indexOf(uid) !== -1
                }));
            return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                direction: "column",
                display: "inline-flex",
                alignItems: "stretch",
                minWidth: "100%",
                borderColor: isActive ? 'primary600' : undefined,
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(Collapse, {
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
                        return /*#__PURE__*/ jsxRuntime.jsx(CollapsePropertyMatrix.CollapsePropertyMatrix, {
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
    const { formatMessage } = reactIntl.useIntl();
    const { modifiedData, onChangeParentCheckbox, onChangeSimpleCheckbox } = usePermissionsDataManager.usePermissionsDataManager();
    const [isConditionModalOpen, setIsConditionModalOpen] = React__namespace.useState(false);
    // This corresponds to the data related to the CT left checkbox
    // modifiedData: { collectionTypes: { [ctuid]: {create: {properties: { fields: {f1: true} }, update: {}, ... } } } }
    const mainData = get(modifiedData, pathToData.split('..'), {});
    // The utils we are using: getCheckboxState, retrieves all the boolean leafs of an object in order
    // to return the state of checkbox. Since the conditions are not related to the property we need to remove the key from the object.
    const dataWithoutCondition = React__namespace.useMemo(()=>{
        return Object.keys(mainData).reduce((acc, current)=>{
            acc[current] = omit(mainData[current], 'conditions');
            return acc;
        }, {});
    }, [
        mainData
    ]);
    const { hasAllActionsSelected, hasSomeActionsSelected } = getCheckboxState.getCheckboxState(dataWithoutCondition);
    // Here we create an array of <checkbox>, since the state of each one of them is used in
    // order to know if whether or not we need to display the associated action in
    // the <ConditionsModal />
    const checkboxesActions = React__namespace.useMemo(()=>{
        return generateCheckboxesActions(availableActions, modifiedData, pathToData);
    }, [
        availableActions,
        modifiedData,
        pathToData
    ]);
    // @ts-expect-error – hasConditions does not exist on all versions of checkboxesActions.
    const doesConditionButtonHasConditions = checkboxesActions.some((action)=>action.hasConditions);
    return /*#__PURE__*/ jsxRuntime.jsxs(BoxWrapper, {
        $isActive: isActive,
        children: [
            /*#__PURE__*/ jsxRuntime.jsxs(Wrapper, {
                height: constants.rowHeight,
                flex: 1,
                alignItems: "center",
                background: isGrey ? 'neutral100' : 'neutral0',
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(RowLabelWithCheckbox.RowLabelWithCheckbox, {
                        isCollapsable: true,
                        isFormDisabled: isFormDisabled,
                        label: strings.capitalise(label),
                        checkboxName: pathToData,
                        onChange: onChangeParentCheckbox,
                        onClick: onClickToggle,
                        someChecked: hasSomeActionsSelected,
                        value: hasAllActionsSelected,
                        isActive: isActive,
                        children: /*#__PURE__*/ jsxRuntime.jsx(Chevron, {
                            paddingLeft: 2,
                            children: isActive ? /*#__PURE__*/ jsxRuntime.jsx(icons.ChevronUp, {}) : /*#__PURE__*/ jsxRuntime.jsx(icons.ChevronDown, {})
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                        style: {
                            flex: 1
                        },
                        children: checkboxesActions.map(({ actionId, hasSomeActionsSelected, isDisplayed, ...restAction })=>{
                            if (!isDisplayed) {
                                return /*#__PURE__*/ jsxRuntime.jsx(HiddenAction.HiddenAction, {}, actionId);
                            }
                            const { hasConditions, hasAllActionsSelected, isParentCheckbox, checkboxName, label: permissionLabel } = restAction;
                            if (isParentCheckbox) {
                                return /*#__PURE__*/ jsxRuntime.jsx(Cell, {
                                    justifyContent: "center",
                                    alignItems: "center",
                                    children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Box, {
                                        position: "relative",
                                        zIndex: 1,
                                        children: [
                                            hasConditions && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                                tag: "span",
                                                position: "absolute",
                                                top: "-6px",
                                                left: "37px",
                                                width: "6px",
                                                height: "6px",
                                                borderRadius: "20px",
                                                background: "primary600"
                                            }),
                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Checkbox, {
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
                            return /*#__PURE__*/ jsxRuntime.jsxs(Cell, {
                                justifyContent: "center",
                                alignItems: "center",
                                children: [
                                    hasConditions && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                        tag: "span",
                                        position: "absolute",
                                        top: "-6px",
                                        left: "37px",
                                        width: "6px",
                                        height: "6px",
                                        borderRadius: "20px",
                                        background: "primary600"
                                    }),
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Checkbox, {
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
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                bottom: "10px",
                right: "9px",
                position: "absolute",
                children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Modal.Root, {
                    open: isConditionModalOpen,
                    onOpenChange: ()=>{
                        setIsConditionModalOpen((prev)=>!prev);
                    },
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Trigger, {
                            children: /*#__PURE__*/ jsxRuntime.jsx(ConditionsButton.ConditionsButton, {
                                hasConditions: doesConditionButtonHasConditions
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(ConditionsModal.ConditionsModal, {
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
            hasConditions: createArrayOfValues.createArrayOfValues(conditionsValue).some((val)=>val),
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
        const { hasAllActionsSelected, hasSomeActionsSelected } = getCheckboxState.getCheckboxState(mainData);
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
  ${ConditionsButton.ConditionsButton} {
    display: block;
  }

  &:focus-within {
    ${()=>activeRowStyle(theme, isActive)}
  }
`;
const Wrapper = styled.styled(designSystem.Flex)`
  border: 1px solid transparent;
`;
const BoxWrapper = styled.styled.div`
  display: inline-flex;
  min-width: 100%;
  position: relative;

  ${ConditionsButton.ConditionsButton} {
    display: none;
  }

  ${({ $isActive, theme })=>$isActive && activeRowStyle(theme, $isActive)}

  &:hover {
    ${({ theme, $isActive })=>activeRowStyle(theme, $isActive)}
  }
`;
const Cell = styled.styled(designSystem.Flex)`
  width: ${constants.cellWidth};
  position: relative;
`;
const Chevron = styled.styled(designSystem.Box)`
  display: none;

  svg {
    width: 1.4rem;
  }

  path {
    fill: ${({ theme })=>theme.colors.primary600};
  }
`;

exports.ContentTypeCollapses = ContentTypeCollapses;
//# sourceMappingURL=ContentTypeCollapses.js.map
