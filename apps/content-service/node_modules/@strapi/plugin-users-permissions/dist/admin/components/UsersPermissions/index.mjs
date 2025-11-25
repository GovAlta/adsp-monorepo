import { jsx, jsxs } from 'react/jsx-runtime';
import { forwardRef, useReducer, useImperativeHandle, memo } from 'react';
import { Grid, Flex, Typography } from '@strapi/design-system';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { UsersPermissionsProvider } from '../../contexts/UsersPermissionsContext/index.mjs';
import getTrad from '../../utils/getTrad.mjs';
import Permissions from '../Permissions/index.mjs';
import Policies from '../Policies/index.mjs';
import init from './init.mjs';
import reducer, { initialState } from './reducer.mjs';

const UsersPermissions = /*#__PURE__*/ forwardRef(({ permissions, routes }, ref)=>{
    const { formatMessage } = useIntl();
    const [state, dispatch] = useReducer(reducer, initialState, (state)=>init(state, permissions, routes));
    useImperativeHandle(ref, ()=>({
            getPermissions () {
                return {
                    permissions: state.modifiedData
                };
            },
            resetForm () {
                dispatch({
                    type: 'ON_RESET'
                });
            },
            setFormAfterSubmit () {
                dispatch({
                    type: 'ON_SUBMIT_SUCCEEDED'
                });
            }
        }));
    const handleChange = ({ target: { name, value } })=>dispatch({
            type: 'ON_CHANGE',
            keys: name.split('.'),
            value: value === 'empty__string_value' ? '' : value
        });
    const handleChangeSelectAll = ({ target: { name, value } })=>dispatch({
            type: 'ON_CHANGE_SELECT_ALL',
            keys: name.split('.'),
            value
        });
    const handleSelectedAction = (actionToSelect)=>dispatch({
            type: 'SELECT_ACTION',
            actionToSelect
        });
    const providerValue = {
        ...state,
        onChange: handleChange,
        onChangeSelectAll: handleChangeSelectAll,
        onSelectedAction: handleSelectedAction
    };
    return /*#__PURE__*/ jsx(UsersPermissionsProvider, {
        value: providerValue,
        children: /*#__PURE__*/ jsxs(Grid.Root, {
            gap: 0,
            shadow: "filterShadow",
            hasRadius: true,
            background: "neutral0",
            children: [
                /*#__PURE__*/ jsx(Grid.Item, {
                    col: 7,
                    paddingTop: 6,
                    paddingBottom: 6,
                    paddingLeft: 7,
                    paddingRight: 7,
                    direction: "column",
                    alignItems: "stretch",
                    children: /*#__PURE__*/ jsxs(Flex, {
                        direction: "column",
                        alignItems: "stretch",
                        gap: 6,
                        children: [
                            /*#__PURE__*/ jsxs(Flex, {
                                direction: "column",
                                alignItems: "stretch",
                                gap: 2,
                                children: [
                                    /*#__PURE__*/ jsx(Typography, {
                                        variant: "delta",
                                        tag: "h2",
                                        children: formatMessage({
                                            id: getTrad('Plugins.header.title'),
                                            defaultMessage: 'Permissions'
                                        })
                                    }),
                                    /*#__PURE__*/ jsx(Typography, {
                                        tag: "p",
                                        textColor: "neutral600",
                                        children: formatMessage({
                                            id: getTrad('Plugins.header.description'),
                                            defaultMessage: 'Only actions bound by a route are listed below.'
                                        })
                                    })
                                ]
                            }),
                            /*#__PURE__*/ jsx(Permissions, {})
                        ]
                    })
                }),
                /*#__PURE__*/ jsx(Policies, {})
            ]
        })
    });
});
UsersPermissions.propTypes = {
    permissions: PropTypes.object.isRequired,
    routes: PropTypes.object.isRequired
};
var UsersPermissions$1 = /*#__PURE__*/ memo(UsersPermissions);

export { UsersPermissions$1 as default };
//# sourceMappingURL=index.mjs.map
