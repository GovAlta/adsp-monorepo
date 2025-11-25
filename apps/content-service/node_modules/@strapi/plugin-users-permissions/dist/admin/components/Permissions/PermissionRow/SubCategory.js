'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var get = require('lodash/get');
var PropTypes = require('prop-types');
var reactIntl = require('react-intl');
var styledComponents = require('styled-components');
var index = require('../../../contexts/UsersPermissionsContext/index.js');
var CheckboxWrapper = require('./CheckboxWrapper.js');

const Border = styledComponents.styled.div`
  flex: 1;
  align-self: center;
  border-top: 1px solid ${({ theme })=>theme.colors.neutral150};
`;
const SubCategory = ({ subCategory })=>{
    const { formatMessage } = reactIntl.useIntl();
    const { onChange, onChangeSelectAll, onSelectedAction, selectedAction, modifiedData } = index.useUsersPermissions();
    const currentScopedModifiedData = React.useMemo(()=>{
        return get(modifiedData, subCategory.name, {});
    }, [
        modifiedData,
        subCategory
    ]);
    const hasAllActionsSelected = React.useMemo(()=>{
        return Object.values(currentScopedModifiedData).every((action)=>action.enabled === true);
    }, [
        currentScopedModifiedData
    ]);
    const hasSomeActionsSelected = React.useMemo(()=>{
        return Object.values(currentScopedModifiedData).some((action)=>action.enabled === true) && !hasAllActionsSelected;
    }, [
        currentScopedModifiedData,
        hasAllActionsSelected
    ]);
    const handleChangeSelectAll = React.useCallback(({ target: { name } })=>{
        onChangeSelectAll({
            target: {
                name,
                value: !hasAllActionsSelected
            }
        });
    }, [
        hasAllActionsSelected,
        onChangeSelectAll
    ]);
    const isActionSelected = React.useCallback((actionName)=>{
        return selectedAction === actionName;
    }, [
        selectedAction
    ]);
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Box, {
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
                            children: subCategory.label
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(Border, {}),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                        paddingLeft: 4,
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Checkbox, {
                            name: subCategory.name,
                            checked: hasSomeActionsSelected ? 'indeterminate' : hasAllActionsSelected,
                            onCheckedChange: (value)=>handleChangeSelectAll({
                                    target: {
                                        name: subCategory.name,
                                        value
                                    }
                                }),
                            children: formatMessage({
                                id: 'app.utils.select-all',
                                defaultMessage: 'Select all'
                            })
                        })
                    })
                ]
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                paddingTop: 6,
                paddingBottom: 6,
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Root, {
                    gap: 2,
                    style: {
                        flex: 1
                    },
                    children: subCategory.actions.map((action)=>{
                        const name = `${action.name}.enabled`;
                        return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                            col: 6,
                            direction: "column",
                            alignItems: "stretch",
                            children: /*#__PURE__*/ jsxRuntime.jsxs(CheckboxWrapper, {
                                isActive: isActionSelected(action.name),
                                padding: 2,
                                hasRadius: true,
                                children: [
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Checkbox, {
                                        checked: get(modifiedData, name, false),
                                        name: name,
                                        onCheckedChange: (value)=>onChange({
                                                target: {
                                                    name,
                                                    value
                                                }
                                            }),
                                        children: action.label
                                    }),
                                    /*#__PURE__*/ jsxRuntime.jsxs("button", {
                                        type: "button",
                                        onClick: ()=>onSelectedAction(action.name),
                                        style: {
                                            display: 'inline-flex',
                                            alignItems: 'center'
                                        },
                                        children: [
                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.VisuallyHidden, {
                                                tag: "span",
                                                children: formatMessage({
                                                    id: 'app.utils.show-bound-route',
                                                    defaultMessage: 'Show bound route for {route}'
                                                }, {
                                                    route: action.name
                                                })
                                            }),
                                            /*#__PURE__*/ jsxRuntime.jsx(icons.Cog, {
                                                id: "cog",
                                                cursor: "pointer"
                                            })
                                        ]
                                    })
                                ]
                            })
                        }, action.name);
                    })
                })
            })
        ]
    });
};
SubCategory.propTypes = {
    subCategory: PropTypes.object.isRequired
};

module.exports = SubCategory;
//# sourceMappingURL=SubCategory.js.map
