'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var designSystem = require('@strapi/design-system');
var get = require('lodash/get');
var isEmpty = require('lodash/isEmpty');
var without = require('lodash/without');
var reactIntl = require('react-intl');
var index = require('../../contexts/UsersPermissionsContext/index.js');
var index$1 = require('../BoundRoute/index.js');

const Policies = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    const { selectedAction, routes } = index.useUsersPermissions();
    const path = without(selectedAction.split('.'), 'controllers');
    const controllerRoutes = get(routes, path[0]);
    const pathResolved = path.slice(1).join('.');
    const displayedRoutes = isEmpty(controllerRoutes) ? [] : controllerRoutes.filter((o)=>o.handler.endsWith(pathResolved));
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
        col: 5,
        background: "neutral150",
        paddingTop: 6,
        paddingBottom: 6,
        paddingLeft: 7,
        paddingRight: 7,
        style: {
            minHeight: '100%'
        },
        direction: "column",
        alignItems: "stretch",
        children: selectedAction ? /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
            direction: "column",
            alignItems: "stretch",
            gap: 2,
            children: displayedRoutes.map((route, key)=>// eslint-disable-next-line react/no-array-index-key
                /*#__PURE__*/ jsxRuntime.jsx(index$1, {
                    route: route
                }, key))
        }) : /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
            direction: "column",
            alignItems: "stretch",
            gap: 2,
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                    variant: "delta",
                    tag: "h3",
                    children: formatMessage({
                        id: 'users-permissions.Policies.header.title',
                        defaultMessage: 'Advanced settings'
                    })
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                    tag: "p",
                    textColor: "neutral600",
                    children: formatMessage({
                        id: 'users-permissions.Policies.header.hint',
                        defaultMessage: "Select the application's actions or the plugin's actions and click on the cog icon to display the bound route"
                    })
                })
            ]
        })
    });
};

module.exports = Policies;
//# sourceMappingURL=index.js.map
