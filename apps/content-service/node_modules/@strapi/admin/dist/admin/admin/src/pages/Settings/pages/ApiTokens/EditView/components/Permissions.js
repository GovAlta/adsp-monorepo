'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var apiTokenPermissions = require('../apiTokenPermissions.js');
var ActionBoundRoutes = require('./ActionBoundRoutes.js');
var ContentTypesSection = require('./ContentTypesSection.js');

const Permissions = ({ ...props })=>{
    const { value: { data } } = apiTokenPermissions.useApiTokenPermissions();
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Grid.Root, {
        gap: 0,
        shadow: "filterShadow",
        hasRadius: true,
        background: "neutral0",
        children: [
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Grid.Item, {
                col: 7,
                paddingTop: 6,
                paddingBottom: 6,
                paddingLeft: 7,
                paddingRight: 7,
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
                                    id: 'Settings.apiTokens.createPage.permissions.title',
                                    defaultMessage: 'Permissions'
                                })
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                tag: "p",
                                textColor: "neutral600",
                                children: formatMessage({
                                    id: 'Settings.apiTokens.createPage.permissions.description',
                                    defaultMessage: 'Only actions bound by a route are listed below.'
                                })
                            })
                        ]
                    }),
                    data?.permissions && /*#__PURE__*/ jsxRuntime.jsx(ContentTypesSection.ContentTypesSection, {
                        section: data?.permissions,
                        ...props
                    })
                ]
            }),
            /*#__PURE__*/ jsxRuntime.jsx(ActionBoundRoutes.ActionBoundRoutes, {})
        ]
    });
};

exports.Permissions = Permissions;
//# sourceMappingURL=Permissions.js.map
