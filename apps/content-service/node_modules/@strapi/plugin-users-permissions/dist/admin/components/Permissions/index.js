'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var index = require('../../contexts/UsersPermissionsContext/index.js');
var formatPluginName = require('../../utils/formatPluginName.js');
var init = require('./init.js');
var index$1 = require('./PermissionRow/index.js');
var reducer = require('./reducer.js');

const Permissions = ()=>{
    const { modifiedData } = index.useUsersPermissions();
    const { formatMessage } = reactIntl.useIntl();
    const [{ collapses }] = React.useReducer(reducer.reducer, reducer.initialState, (state)=>init(state, modifiedData));
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Accordion.Root, {
        size: "M",
        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
            direction: "column",
            alignItems: "stretch",
            gap: 1,
            children: collapses.map((collapse, index)=>/*#__PURE__*/ jsxRuntime.jsxs(designSystem.Accordion.Item, {
                    value: collapse.name,
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Accordion.Header, {
                            variant: index % 2 === 0 ? 'secondary' : undefined,
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Accordion.Trigger, {
                                caretPosition: "right",
                                description: formatMessage({
                                    id: 'users-permissions.Plugin.permissions.plugins.description',
                                    defaultMessage: 'Define all allowed actions for the {name} plugin.'
                                }, {
                                    name: collapse.name
                                }),
                                children: formatPluginName(collapse.name)
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Accordion.Content, {
                            children: /*#__PURE__*/ jsxRuntime.jsx(index$1, {
                                permissions: modifiedData[collapse.name],
                                name: collapse.name
                            })
                        })
                    ]
                }, collapse.name))
        })
    });
};

module.exports = Permissions;
//# sourceMappingURL=index.js.map
