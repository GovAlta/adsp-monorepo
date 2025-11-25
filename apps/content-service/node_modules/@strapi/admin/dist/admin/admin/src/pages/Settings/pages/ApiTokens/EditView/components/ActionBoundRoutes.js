'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var apiTokenPermissions = require('../apiTokenPermissions.js');
var BoundRoute = require('./BoundRoute.js');

const ActionBoundRoutes = ()=>{
    const { value: { selectedAction, routes } } = apiTokenPermissions.useApiTokenPermissions();
    const { formatMessage } = reactIntl.useIntl();
    const actionSection = selectedAction?.split('.')[0];
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
            children: actionSection && actionSection in routes && routes[actionSection].map((route)=>{
                return route.config.auth?.scope?.includes(selectedAction) || route.handler === selectedAction ? /*#__PURE__*/ jsxRuntime.jsx(BoundRoute.BoundRoute, {
                    route: route
                }, route.handler) : null;
            })
        }) : /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
            direction: "column",
            alignItems: "stretch",
            gap: 2,
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                    variant: "delta",
                    tag: "h3",
                    children: formatMessage({
                        id: 'Settings.apiTokens.createPage.permissions.header.title',
                        defaultMessage: 'Advanced settings'
                    })
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                    tag: "p",
                    textColor: "neutral600",
                    children: formatMessage({
                        id: 'Settings.apiTokens.createPage.permissions.header.hint',
                        defaultMessage: "Select the application's actions or the plugin's actions and click on the cog icon to display the bound route"
                    })
                })
            ]
        })
    });
};

exports.ActionBoundRoutes = ActionBoundRoutes;
//# sourceMappingURL=ActionBoundRoutes.js.map
