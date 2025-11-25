import { jsxs, jsx } from 'react/jsx-runtime';
import 'react';
import { Box, Accordion, Flex, Typography, Checkbox, Grid } from '@strapi/design-system';
import { Cog } from '@strapi/icons';
import capitalize from 'lodash/capitalize';
import { useIntl } from 'react-intl';
import { css, styled } from 'styled-components';
import { useApiTokenPermissions } from '../apiTokenPermissions.mjs';

const activeCheckboxWrapperStyles = css`
  background: ${(props)=>props.theme.colors.primary100};

  #cog {
    opacity: 1;
  }
`;
const CheckboxWrapper = styled(Box)`
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
const Border = styled.div`
  flex: 1;
  align-self: center;
  border-top: 1px solid ${({ theme })=>theme.colors.neutral150};
`;
const CollapsableContentType = ({ controllers = [], label, orderNumber = 0, disabled = false })=>{
    const { value: { onChangeSelectAll, onChange, selectedActions, setSelectedAction, selectedAction } } = useApiTokenPermissions();
    const { formatMessage } = useIntl();
    const isActionSelected = (actionId)=>actionId === selectedAction;
    return /*#__PURE__*/ jsxs(Accordion.Item, {
        value: `${label}-${orderNumber}`,
        children: [
            /*#__PURE__*/ jsx(Accordion.Header, {
                variant: orderNumber % 2 ? 'primary' : 'secondary',
                children: /*#__PURE__*/ jsx(Accordion.Trigger, {
                    children: capitalize(label)
                })
            }),
            /*#__PURE__*/ jsx(Accordion.Content, {
                children: controllers?.map((controller)=>{
                    const allActionsSelected = controller.actions.every((action)=>selectedActions.includes(action.actionId));
                    const someActionsSelected = controller.actions.some((action)=>selectedActions.includes(action.actionId));
                    return /*#__PURE__*/ jsxs(Box, {
                        children: [
                            /*#__PURE__*/ jsxs(Flex, {
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: 4,
                                children: [
                                    /*#__PURE__*/ jsx(Box, {
                                        paddingRight: 4,
                                        children: /*#__PURE__*/ jsx(Typography, {
                                            variant: "sigma",
                                            textColor: "neutral600",
                                            children: controller?.controller
                                        })
                                    }),
                                    /*#__PURE__*/ jsx(Border, {}),
                                    /*#__PURE__*/ jsx(Box, {
                                        paddingLeft: 4,
                                        children: /*#__PURE__*/ jsx(Checkbox, {
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
                            /*#__PURE__*/ jsx(Grid.Root, {
                                gap: 4,
                                padding: 4,
                                children: controller?.actions && controller?.actions.map((action)=>{
                                    return /*#__PURE__*/ jsx(Grid.Item, {
                                        col: 6,
                                        direction: "column",
                                        alignItems: "stretch",
                                        children: /*#__PURE__*/ jsxs(CheckboxWrapper, {
                                            $isActive: isActionSelected(action.actionId),
                                            padding: 2,
                                            hasRadius: true,
                                            children: [
                                                /*#__PURE__*/ jsx(Checkbox, {
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
                                                    children: /*#__PURE__*/ jsx("span", {
                                                        style: {
                                                            overflowWrap: 'anywhere'
                                                        },
                                                        children: action.action
                                                    })
                                                }),
                                                /*#__PURE__*/ jsx("button", {
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
                                                    children: /*#__PURE__*/ jsx(Cog, {
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

export { CollapsableContentType };
//# sourceMappingURL=CollapsableContentType.mjs.map
