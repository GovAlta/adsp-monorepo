import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import * as React from 'react';
import { Flex, Box, Typography, Checkbox } from '@strapi/design-system';
import { CaretDown } from '@strapi/icons';
import get from 'lodash/get';
import { useIntl } from 'react-intl';
import { styled, css } from 'styled-components';
import { usePermissionsDataManager } from '../hooks/usePermissionsDataManager.mjs';
import { rowHeight, cellWidth, firstRowWidth } from '../utils/constants.mjs';
import { getCheckboxState } from '../utils/getCheckboxState.mjs';
import { CollapseLabel } from './CollapseLabel.mjs';
import { HiddenAction } from './HiddenAction.mjs';
import { RequiredSign } from './RequiredSign.mjs';
import { RowLabelWithCheckbox } from './RowLabelWithCheckbox.mjs';

const CollapsePropertyMatrix = ({ availableActions = [], childrenForm = [], isFormDisabled, label, pathToData, propertyName })=>{
    const propertyActions = React.useMemo(()=>availableActions.map((action)=>{
            const isActionRelatedToCurrentProperty = Array.isArray(action.applyToProperties) && action.applyToProperties.indexOf(propertyName) !== -1 && action.isDisplayed;
            return {
                label: action.label,
                actionId: action.actionId,
                isActionRelatedToCurrentProperty
            };
        }), [
        availableActions,
        propertyName
    ]);
    return /*#__PURE__*/ jsxs(Flex, {
        display: "inline-flex",
        direction: "column",
        alignItems: "stretch",
        minWidth: 0,
        children: [
            /*#__PURE__*/ jsx(Header, {
                label: label,
                headers: propertyActions
            }),
            /*#__PURE__*/ jsx(Box, {
                children: childrenForm.map(({ children: childrenForm, label, value, required }, i)=>/*#__PURE__*/ jsx(ActionRow, {
                        childrenForm: childrenForm,
                        label: label,
                        isFormDisabled: isFormDisabled,
                        name: value,
                        required: required,
                        propertyActions: propertyActions,
                        pathToData: pathToData,
                        propertyName: propertyName,
                        isOdd: i % 2 === 0
                    }, value))
            })
        ]
    });
};
const ActionRow = ({ childrenForm = [], label, isFormDisabled = false, name, required = false, pathToData, propertyActions, propertyName, isOdd = false })=>{
    const { formatMessage } = useIntl();
    const [rowToOpen, setRowToOpen] = React.useState(null);
    const { modifiedData, onChangeCollectionTypeLeftActionRowCheckbox, onChangeParentCheckbox, onChangeSimpleCheckbox } = usePermissionsDataManager();
    const isActive = rowToOpen === name;
    const recursiveChildren = React.useMemo(()=>{
        if (!Array.isArray(childrenForm)) {
            return [];
        }
        return childrenForm;
    }, [
        childrenForm
    ]);
    const isCollapsable = recursiveChildren.length > 0;
    const handleClick = React.useCallback(()=>{
        if (isCollapsable) {
            setRowToOpen((prev)=>{
                if (prev === name) {
                    return null;
                }
                return name;
            });
        }
    }, [
        isCollapsable,
        name
    ]);
    const handleChangeLeftRowCheckbox = ({ target: { value } })=>{
        onChangeCollectionTypeLeftActionRowCheckbox(pathToData, propertyName, name, value);
    };
    const { hasAllActionsSelected, hasSomeActionsSelected } = React.useMemo(()=>{
        return getRowLabelCheckboxState(propertyActions, modifiedData, pathToData, propertyName, name);
    }, [
        propertyActions,
        modifiedData,
        pathToData,
        propertyName,
        name
    ]);
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            /*#__PURE__*/ jsx(Wrapper, {
                alignItems: "center",
                $isCollapsable: isCollapsable,
                $isActive: isActive,
                background: isOdd ? 'neutral100' : 'neutral0',
                children: /*#__PURE__*/ jsxs(Flex, {
                    children: [
                        /*#__PURE__*/ jsxs(RowLabelWithCheckbox, {
                            onChange: handleChangeLeftRowCheckbox,
                            onClick: handleClick,
                            isCollapsable: isCollapsable,
                            isFormDisabled: isFormDisabled,
                            label: label,
                            someChecked: hasSomeActionsSelected,
                            value: hasAllActionsSelected,
                            isActive: isActive,
                            children: [
                                required && /*#__PURE__*/ jsx(RequiredSign, {}),
                                /*#__PURE__*/ jsx(CarretIcon, {
                                    $isActive: isActive
                                })
                            ]
                        }),
                        /*#__PURE__*/ jsx(Flex, {
                            children: propertyActions.map(({ label, isActionRelatedToCurrentProperty, actionId })=>{
                                if (!isActionRelatedToCurrentProperty) {
                                    return /*#__PURE__*/ jsx(HiddenAction, {}, label);
                                }
                                const checkboxName = [
                                    ...pathToData.split('..'),
                                    actionId,
                                    'properties',
                                    propertyName,
                                    name
                                ];
                                if (!isCollapsable) {
                                    const checkboxValue = get(modifiedData, checkboxName, false);
                                    return /*#__PURE__*/ jsx(Flex, {
                                        width: cellWidth,
                                        position: "relative",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        children: /*#__PURE__*/ jsx(Checkbox, {
                                            disabled: isFormDisabled,
                                            name: checkboxName.join('..'),
                                            "aria-label": formatMessage({
                                                id: `Settings.permissions.select-by-permission`,
                                                defaultMessage: 'Select {label} permission'
                                            }, {
                                                label: `${name} ${label}`
                                            }),
                                            onCheckedChange: (value)=>{
                                                onChangeSimpleCheckbox({
                                                    target: {
                                                        name: checkboxName.join('..'),
                                                        value: !!value
                                                    }
                                                });
                                            },
                                            checked: checkboxValue
                                        })
                                    }, actionId);
                                }
                                const data = get(modifiedData, checkboxName, {});
                                const { hasAllActionsSelected, hasSomeActionsSelected } = getCheckboxState(data);
                                return /*#__PURE__*/ jsx(Flex, {
                                    width: cellWidth,
                                    position: "relative",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    children: /*#__PURE__*/ jsx(Checkbox, {
                                        disabled: isFormDisabled,
                                        name: checkboxName.join('..'),
                                        onCheckedChange: (value)=>{
                                            onChangeParentCheckbox({
                                                target: {
                                                    name: checkboxName.join('..'),
                                                    value: !!value
                                                }
                                            });
                                        },
                                        "aria-label": formatMessage({
                                            id: `Settings.permissions.select-by-permission`,
                                            defaultMessage: 'Select {label} permission'
                                        }, {
                                            label: `${name} ${label}`
                                        }),
                                        checked: hasSomeActionsSelected ? 'indeterminate' : hasAllActionsSelected
                                    })
                                }, label);
                            })
                        })
                    ]
                })
            }),
            isActive && /*#__PURE__*/ jsx(SubActionRow, {
                childrenForm: recursiveChildren,
                isFormDisabled: isFormDisabled,
                parentName: name,
                pathToDataFromActionRow: pathToData,
                propertyName: propertyName,
                propertyActions: propertyActions,
                recursiveLevel: 0
            })
        ]
    });
};
/**
 *
 * Returns the state of the left checkbox of a ActionRow main checkbox
 */ const getRowLabelCheckboxState = (propertyActions, modifiedData, pathToContentType, propertyToCheck, targetKey)=>{
    const actionIds = propertyActions.reduce((acc, current)=>{
        if (current.isActionRelatedToCurrentProperty) {
            acc.push(current.actionId);
        }
        return acc;
    }, []);
    const data = actionIds.reduce((acc, current)=>{
        const mainData = get(modifiedData, [
            ...pathToContentType.split('..'),
            current,
            'properties',
            propertyToCheck,
            targetKey
        ], false);
        acc[current] = mainData;
        return acc;
    }, {});
    return getCheckboxState(data);
};
const Wrapper = styled(Flex)`
  height: ${rowHeight};
  flex: 1;

  &:hover {
    ${({ $isCollapsable, theme })=>$isCollapsable && activeStyle(theme)}
  }

  ${({ $isCollapsable })=>$isCollapsable && `
      ${CarretIcon} {
        display: flex;
      }
  `}
  ${({ $isActive, theme })=>$isActive && activeStyle(theme)};
`;
const CarretIcon = styled(CaretDown)`
  display: none;

  svg {
    width: 1.4rem;
  }

  path {
    fill: ${({ theme })=>theme.colors.neutral200};
  }

  transform: rotate(${({ $isActive })=>$isActive ? '180' : '0'}deg);
  margin-left: ${({ theme })=>theme.spaces[2]};
`;
const SubActionRow = ({ childrenForm = [], isFormDisabled, recursiveLevel, pathToDataFromActionRow, propertyActions, parentName, propertyName })=>{
    const { formatMessage } = useIntl();
    const { modifiedData, onChangeParentCheckbox, onChangeSimpleCheckbox } = usePermissionsDataManager();
    const [rowToOpen, setRowToOpen] = React.useState(null);
    const handleClickToggleSubLevel = (name)=>{
        setRowToOpen((prev)=>{
            if (prev === name) {
                return null;
            }
            return name;
        });
    };
    const displayedRecursiveChildren = React.useMemo(()=>{
        if (!rowToOpen) {
            return null;
        }
        return childrenForm.find(({ value })=>value === rowToOpen);
    }, [
        rowToOpen,
        childrenForm
    ]);
    return /*#__PURE__*/ jsxs(Box, {
        paddingLeft: `3.2rem`,
        children: [
            /*#__PURE__*/ jsx(TopTimeline, {}),
            childrenForm.map(({ label, value, required, children: subChildrenForm }, index)=>{
                const isVisible = index + 1 < childrenForm.length;
                const isArrayType = Array.isArray(subChildrenForm);
                const isActive = rowToOpen === value;
                return /*#__PURE__*/ jsxs(LeftBorderTimeline, {
                    $isVisible: isVisible,
                    children: [
                        /*#__PURE__*/ jsxs(Flex, {
                            height: rowHeight,
                            children: [
                                /*#__PURE__*/ jsx(StyledBox, {
                                    children: /*#__PURE__*/ jsx(Svg, {
                                        width: "20",
                                        height: "23",
                                        viewBox: "0 0 20 23",
                                        fill: "none",
                                        xmlns: "http://www.w3.org/2000/svg",
                                        $color: "primary200",
                                        children: /*#__PURE__*/ jsx("path", {
                                            fillRule: "evenodd",
                                            clipRule: "evenodd",
                                            d: "M7.02477 14.7513C8.65865 17.0594 11.6046 18.6059 17.5596 18.8856C18.6836 18.9384 19.5976 19.8435 19.5976 20.9688V20.9688C19.5976 22.0941 18.6841 23.0125 17.5599 22.9643C10.9409 22.6805 6.454 20.9387 3.75496 17.1258C0.937988 13.1464 0.486328 7.39309 0.486328 0.593262H4.50974C4.50974 7.54693 5.06394 11.9813 7.02477 14.7513Z",
                                            fill: "#D9D8FF"
                                        })
                                    })
                                }),
                                /*#__PURE__*/ jsxs(Flex, {
                                    style: {
                                        flex: 1
                                    },
                                    children: [
                                        /*#__PURE__*/ jsx(RowStyle, {
                                            $level: recursiveLevel,
                                            $isActive: isActive,
                                            $isCollapsable: isArrayType,
                                            children: /*#__PURE__*/ jsxs(CollapseLabel, {
                                                alignItems: "center",
                                                $isCollapsable: isArrayType,
                                                ...isArrayType && {
                                                    onClick: ()=>handleClickToggleSubLevel(value),
                                                    'aria-expanded': isActive,
                                                    onKeyDown: ({ key })=>(key === 'Enter' || key === ' ') && handleClickToggleSubLevel(value),
                                                    tabIndex: 0,
                                                    role: 'button'
                                                },
                                                title: label,
                                                children: [
                                                    /*#__PURE__*/ jsx(RowLabel, {
                                                        ellipsis: true,
                                                        children: label
                                                    }),
                                                    required && /*#__PURE__*/ jsx(RequiredSign, {}),
                                                    /*#__PURE__*/ jsx(CarretIcon, {
                                                        $isActive: isActive
                                                    })
                                                ]
                                            })
                                        }),
                                        /*#__PURE__*/ jsx(Flex, {
                                            style: {
                                                flex: 1
                                            },
                                            children: propertyActions.map(({ actionId, label: propertyLabel, isActionRelatedToCurrentProperty })=>{
                                                if (!isActionRelatedToCurrentProperty) {
                                                    return /*#__PURE__*/ jsx(HiddenAction, {}, actionId);
                                                }
                                                /*
                       * Usually we use a 'dot' in order to know the key path of an object for which we want to change the value.
                       * Since an action and a subject are both separated by '.' or '::' we chose to use the '..' separators
                       */ const checkboxName = [
                                                    ...pathToDataFromActionRow.split('..'),
                                                    actionId,
                                                    'properties',
                                                    propertyName,
                                                    ...parentName.split('..'),
                                                    value
                                                ];
                                                const checkboxValue = get(modifiedData, checkboxName, false);
                                                if (!subChildrenForm) {
                                                    return /*#__PURE__*/ jsx(Flex, {
                                                        position: "relative",
                                                        width: cellWidth,
                                                        justifyContent: "center",
                                                        alignItems: "center",
                                                        children: /*#__PURE__*/ jsx(Checkbox, {
                                                            disabled: isFormDisabled,
                                                            name: checkboxName.join('..'),
                                                            "aria-label": formatMessage({
                                                                id: `Settings.permissions.select-by-permission`,
                                                                defaultMessage: 'Select {label} permission'
                                                            }, {
                                                                label: `${parentName} ${label} ${propertyLabel}`
                                                            }),
                                                            onCheckedChange: (value)=>{
                                                                onChangeSimpleCheckbox({
                                                                    target: {
                                                                        name: checkboxName.join('..'),
                                                                        value: !!value
                                                                    }
                                                                });
                                                            },
                                                            checked: checkboxValue
                                                        })
                                                    }, propertyLabel);
                                                }
                                                const { hasAllActionsSelected, hasSomeActionsSelected } = getCheckboxState(checkboxValue);
                                                return /*#__PURE__*/ jsx(Flex, {
                                                    position: "relative",
                                                    width: cellWidth,
                                                    justifyContent: "center",
                                                    alignItems: "center",
                                                    children: /*#__PURE__*/ jsx(Checkbox, {
                                                        disabled: isFormDisabled,
                                                        name: checkboxName.join('..'),
                                                        "aria-label": formatMessage({
                                                            id: `Settings.permissions.select-by-permission`,
                                                            defaultMessage: 'Select {label} permission'
                                                        }, {
                                                            label: `${parentName} ${label} ${propertyLabel}`
                                                        }),
                                                        // Keep same signature as packages/core/admin/admin/src/components/Roles/Permissions/index.js l.91
                                                        onCheckedChange: (value)=>{
                                                            onChangeParentCheckbox({
                                                                target: {
                                                                    name: checkboxName.join('..'),
                                                                    value: !!value
                                                                }
                                                            });
                                                        },
                                                        checked: hasSomeActionsSelected ? 'indeterminate' : hasAllActionsSelected
                                                    }, propertyLabel)
                                                }, propertyLabel);
                                            })
                                        })
                                    ]
                                })
                            ]
                        }),
                        displayedRecursiveChildren && isActive && /*#__PURE__*/ jsx(Box, {
                            paddingBottom: 2,
                            children: /*#__PURE__*/ jsx(SubActionRow, {
                                isFormDisabled: isFormDisabled,
                                parentName: `${parentName}..${value}`,
                                pathToDataFromActionRow: pathToDataFromActionRow,
                                propertyActions: propertyActions,
                                propertyName: propertyName,
                                recursiveLevel: recursiveLevel + 1,
                                childrenForm: displayedRecursiveChildren.children
                            })
                        })
                    ]
                }, value);
            })
        ]
    });
};
const LeftBorderTimeline = styled(Box)`
  border-left: ${({ $isVisible, theme })=>$isVisible ? `4px solid ${theme.colors.primary200}` : '4px solid transparent'};
`;
const RowStyle = styled(Flex)`
  padding-left: ${({ theme })=>theme.spaces[4]};
  width: ${({ $level })=>145 - $level * 36}px;

  &:hover {
    ${({ $isCollapsable, theme })=>$isCollapsable && activeStyle(theme)}
  }

  ${({ $isCollapsable })=>$isCollapsable && `
      ${CarretIcon} {
        display: flex;
      }
  `}
  ${({ $isActive, theme })=>$isActive && activeStyle(theme)};
`;
const RowLabel = styled(Typography)``;
const TopTimeline = styled.div`
  padding-top: ${({ theme })=>theme.spaces[2]};
  margin-top: ${({ theme })=>theme.spaces[2]};
  width: 0.4rem;
  background-color: ${({ theme })=>theme.colors.primary200};
  border-top-left-radius: 2px;
  border-top-right-radius: 2px;
`;
const StyledBox = styled(Box)`
  transform: translate(-4px, -12px);

  &:before {
    content: '';
    width: 0.4rem;
    height: 1.2rem;
    background: ${({ theme })=>theme.colors.primary200};
    display: block;
  }
`;
const Svg = styled.svg`
  position: relative;
  flex-shrink: 0;
  transform: translate(-0.5px, -1px);

  * {
    fill: ${({ theme, $color })=>theme.colors[$color]};
  }
`;
const Header = ({ headers = [], label })=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsxs(Flex, {
        children: [
            /*#__PURE__*/ jsx(Flex, {
                width: firstRowWidth,
                height: rowHeight,
                shrink: 0,
                alignItems: "center",
                paddingLeft: 6,
                children: /*#__PURE__*/ jsx(Typography, {
                    variant: "sigma",
                    textColor: "neutral500",
                    children: formatMessage({
                        id: 'Settings.roles.form.permission.property-label',
                        defaultMessage: '{label} permissions'
                    }, {
                        label
                    })
                })
            }),
            headers.map((header)=>{
                if (!header.isActionRelatedToCurrentProperty) {
                    return /*#__PURE__*/ jsx(Flex, {
                        width: cellWidth,
                        shrink: 0
                    }, header.label);
                }
                return /*#__PURE__*/ jsx(Flex, {
                    width: cellWidth,
                    shrink: 0,
                    justifyContent: "center",
                    children: /*#__PURE__*/ jsx(Typography, {
                        variant: "sigma",
                        textColor: "neutral500",
                        children: formatMessage({
                            id: `Settings.roles.form.permissions.${header.label.toLowerCase()}`,
                            defaultMessage: header.label
                        })
                    })
                }, header.label);
            })
        ]
    });
};
const activeStyle = (theme)=>css`
  color: ${theme.colors.primary600};
  font-weight: ${theme.fontWeights.bold};

  ${CarretIcon} {
    path {
      fill: ${theme.colors.primary600};
    }
  }
`;

export { CollapsePropertyMatrix };
//# sourceMappingURL=CollapsePropertyMatrix.mjs.map
