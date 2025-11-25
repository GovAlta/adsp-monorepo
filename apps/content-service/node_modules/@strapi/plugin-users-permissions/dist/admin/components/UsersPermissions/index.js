'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var PropTypes = require('prop-types');
var reactIntl = require('react-intl');
var index = require('../../contexts/UsersPermissionsContext/index.js');
var getTrad = require('../../utils/getTrad.js');
var index$1 = require('../Permissions/index.js');
var index$2 = require('../Policies/index.js');
var init = require('./init.js');
var reducer = require('./reducer.js');

const UsersPermissions = /*#__PURE__*/ React.forwardRef(({ permissions, routes }, ref)=>{
    const { formatMessage } = reactIntl.useIntl();
    const [state, dispatch] = React.useReducer(reducer.default, reducer.initialState, (state)=>init(state, permissions, routes));
    React.useImperativeHandle(ref, ()=>({
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
    return /*#__PURE__*/ jsxRuntime.jsx(index.UsersPermissionsProvider, {
        value: providerValue,
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Grid.Root, {
            gap: 0,
            shadow: "filterShadow",
            hasRadius: true,
            background: "neutral0",
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                    col: 7,
                    paddingTop: 6,
                    paddingBottom: 6,
                    paddingLeft: 7,
                    paddingRight: 7,
                    direction: "column",
                    alignItems: "stretch",
                    children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                        direction: "column",
                        alignItems: "stretch",
                        gap: 6,
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                direction: "column",
                                alignItems: "stretch",
                                gap: 2,
                                children: [
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                        variant: "delta",
                                        tag: "h2",
                                        children: formatMessage({
                                            id: getTrad('Plugins.header.title'),
                                            defaultMessage: 'Permissions'
                                        })
                                    }),
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                        tag: "p",
                                        textColor: "neutral600",
                                        children: formatMessage({
                                            id: getTrad('Plugins.header.description'),
                                            defaultMessage: 'Only actions bound by a route are listed below.'
                                        })
                                    })
                                ]
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(index$1, {})
                        ]
                    })
                }),
                /*#__PURE__*/ jsxRuntime.jsx(index$2, {})
            ]
        })
    });
});
UsersPermissions.propTypes = {
    permissions: PropTypes.object.isRequired,
    routes: PropTypes.object.isRequired
};
var UsersPermissions$1 = /*#__PURE__*/ React.memo(UsersPermissions);

module.exports = UsersPermissions$1;
//# sourceMappingURL=index.js.map
