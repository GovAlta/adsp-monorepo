'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var capitalize = require('lodash/capitalize');
var reactIntl = require('react-intl');
var styled = require('styled-components');
var apiTokenPermissions = require('../apiTokenPermissions.js');

const activeCheckboxWrapperStyles = styled.css`
  background: ${(props)=>props.theme.colors.primary100};

  #cog {
    opacity: 1;
  }
`;
const CheckboxWrapper = styled.styled(designSystem.Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;

  #cog {
    opacity: 0;
    path {
      fill: ${(props)=>props.theme.colors.primary600};
    }
  }

  /* Show active style both on hover and when the action is selected */
  ${(props)=>props.$isActive && activeCheckboxWrapperStyles}
  &:hover {
    ${activeCheckboxWrapperStyles}
  }
`;
const Border = styled.styled.div`
  flex: 1;
  align-self: center;
  border-top: 1px solid ${({ theme })=>theme.colors.neutral150};
`;
const CollapsableContentType = ({ controllers = [], label, orderNumber = 0, disabled = false })=>{
    const { value: { onChangeSelectAll, onChange, selectedActions, setSelectedAction, selectedAction } } = apiTokenPermissions.useApiTokenPermissions();
    const { formatMessage } = reactIntl.useIntl();
    const isActionSelected = (actionId)=>actionId === selectedAction;
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Accordion.Item, {
        value: `${label}-${orderNumber}`,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Accordion.Header, {
                variant: orderNumber % 2 ? 'primary' : 'secondary',
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Accordion.Trigger, {
                    children: capitalize(label)
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Accordion.Content, {
                children: controllers?.map((controller)=>{
                    const allActionsSelected = controller.actions.every((action)=>selectedActions.includes(action.actionId));
                    const someActionsSelected = controller.actions.some((action)=>selectedActions.includes(action.actionId));
                    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Box, {
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: 4,
                                children: [
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                        paddingRight: 4,
                                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                            variant: "sigma",
                                            textColor: "neutral600",
                                            children: controller?.controller
                                        })
                                    }),
                                    /*#__PURE__*/ jsxRuntime.jsx(Border, {}),
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                        paddingLeft: 4,
                                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Checkbox, {
                                            checked: !allActionsSelected && someActionsSelected ? 'indeterminate' : allActionsSelected,
                                            onCheckedChange: ()=>{
                                                onChangeSelectAll({
                                                    target: {
                                                        value: [
                                                            ...controller.actions
                                                        ]
                                                    }
                                                });
                                            },
                                            disabled: disabled,
                                            children: formatMessage({
                                                id: 'app.utils.select-all',
                                                defaultMessage: 'Select all'
                                            })
                                        })
                                    })
                                ]
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Root, {
                                gap: 4,
                                padding: 4,
                                children: controller?.actions && controller?.actions.map((action)=>{
                                    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                                        col: 6,
                                        direction: "column",
                                        alignItems: "stretch",
                                        children: /*#__PURE__*/ jsxRuntime.jsxs(CheckboxWrapper, {
                                            $isActive: isActionSelected(action.actionId),
                                            padding: 2,
                                            hasRadius: true,
                                            children: [
                                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Checkbox, {
                                                    checked: selectedActions.includes(action.actionId),
                                                    name: action.actionId,
                                                    onCheckedChange: ()=>{
                                                        onChange({
                                                            target: {
                                                                value: action.actionId
                                                            }
                                                        });
                                                    },
                                                    disabled: disabled,
                                                    children: /*#__PURE__*/ jsxRuntime.jsx("span", {
                                                        style: {
                                                            overflowWrap: 'anywhere'
                                                        },
                                                        children: action.action
                                                    })
                                                }),
                                                /*#__PURE__*/ jsxRuntime.jsx("button", {
                                                    type: "button",
                                                    "data-testid": "action-cog",
                                                    onClick: ()=>setSelectedAction({
                                                            target: {
                                                                value: action.actionId
                                                            }
                                                        }),
                                                    style: {
                                                        display: 'inline-flex',
                                                        alignItems: 'center'
                                                    },
                                                    children: /*#__PURE__*/ jsxRuntime.jsx(icons.Cog, {
                                                        id: "cog"
                                                    })
                                                })
                                            ]
                                        })
                                    }, action.actionId);
                                })
                            })
                        ]
                    }, `${label}.${controller?.controller}`);
                })
            })
        ]
    });
};

exports.CollapsableContentType = CollapsableContentType;
//# sourceMappingURL=CollapsableContentType.js.map
