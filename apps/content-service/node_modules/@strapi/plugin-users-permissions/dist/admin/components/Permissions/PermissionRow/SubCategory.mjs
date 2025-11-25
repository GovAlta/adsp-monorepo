import { jsxs, jsx } from 'react/jsx-runtime';
import { useMemo, useCallback } from 'react';
import { Box, Flex, Typography, Checkbox, Grid, VisuallyHidden } from '@strapi/design-system';
import { Cog } from '@strapi/icons';
import get from 'lodash/get';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { styled } from 'styled-components';
import { useUsersPermissions } from '../../../contexts/UsersPermissionsContext/index.mjs';
import CheckboxWrapper from './CheckboxWrapper.mjs';

const Border = styled.div`
  flex: 1;
  align-self: center;
  border-top: 1px solid ${({ theme })=>theme.colors.neutral150};
`;
const SubCategory = ({ subCategory })=>{
    const { formatMessage } = useIntl();
    const { onChange, onChangeSelectAll, onSelectedAction, selectedAction, modifiedData } = useUsersPermissions();
    const currentScopedModifiedData = useMemo(()=>{
        return get(modifiedData, subCategory.name, {});
    }, [
        modifiedData,
        subCategory
    ]);
    const hasAllActionsSelected = useMemo(()=>{
        return Object.values(currentScopedModifiedData).every((action)=>action.enabled === true);
    }, [
        currentScopedModifiedData
    ]);
    const hasSomeActionsSelected = useMemo(()=>{
        return Object.values(currentScopedModifiedData).some((action)=>action.enabled === true) && !hasAllActionsSelected;
    }, [
        currentScopedModifiedData,
        hasAllActionsSelected
    ]);
    const handleChangeSelectAll = useCallback(({ target: { name } })=>{
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
    const isActionSelected = useCallback((actionName)=>{
        return selectedAction === actionName;
    }, [
        selectedAction
    ]);
    return /*#__PURE__*/ jsxs(Box, {
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
                            children: subCategory.label
                        })
                    }),
                    /*#__PURE__*/ jsx(Border, {}),
                    /*#__PURE__*/ jsx(Box, {
                        paddingLeft: 4,
                        children: /*#__PURE__*/ jsx(Checkbox, {
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
            /*#__PURE__*/ jsx(Flex, {
                paddingTop: 6,
                paddingBottom: 6,
                children: /*#__PURE__*/ jsx(Grid.Root, {
                    gap: 2,
                    style: {
                        flex: 1
                    },
                    children: subCategory.actions.map((action)=>{
                        const name = `${action.name}.enabled`;
                        return /*#__PURE__*/ jsx(Grid.Item, {
                            col: 6,
                            direction: "column",
                            alignItems: "stretch",
                            children: /*#__PURE__*/ jsxs(CheckboxWrapper, {
                                isActive: isActionSelected(action.name),
                                padding: 2,
                                hasRadius: true,
                                children: [
                                    /*#__PURE__*/ jsx(Checkbox, {
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
                                    /*#__PURE__*/ jsxs("button", {
                                        type: "button",
                                        onClick: ()=>onSelectedAction(action.name),
                                        style: {
                                            display: 'inline-flex',
                                            alignItems: 'center'
                                        },
                                        children: [
                                            /*#__PURE__*/ jsx(VisuallyHidden, {
                                                tag: "span",
                                                children: formatMessage({
                                                    id: 'app.utils.show-bound-route',
                                                    defaultMessage: 'Show bound route for {route}'
                                                }, {
                                                    route: action.name
                                                })
                                            }),
                                            /*#__PURE__*/ jsx(Cog, {
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

export { SubCategory as default };
//# sourceMappingURL=SubCategory.mjs.map
