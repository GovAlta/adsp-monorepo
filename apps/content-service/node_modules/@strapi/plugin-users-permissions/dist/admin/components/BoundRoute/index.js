'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var designSystem = require('@strapi/design-system');
var map = require('lodash/map');
var tail = require('lodash/tail');
var PropTypes = require('prop-types');
var reactIntl = require('react-intl');
var styledComponents = require('styled-components');
var getMethodColor = require('./getMethodColor.js');

const MethodBox = styledComponents.styled(designSystem.Box)`
  margin: -1px;
  border-radius: ${({ theme })=>theme.spaces[1]} 0 0 ${({ theme })=>theme.spaces[1]};
`;
function BoundRoute({ route }) {
    const { formatMessage } = reactIntl.useIntl();
    const { method, handler: title, path } = route;
    const formattedRoute = path ? tail(path.split('/')) : [];
    const [controller = '', action = ''] = title ? title.split('.') : [];
    const colors = getMethodColor(route.method);
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
        direction: "column",
        alignItems: "stretch",
        gap: 2,
        children: [
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Typography, {
                variant: "delta",
                tag: "h3",
                children: [
                    formatMessage({
                        id: 'users-permissions.BoundRoute.title',
                        defaultMessage: 'Bound route to'
                    }),
                    " ",
                    /*#__PURE__*/ jsxRuntime.jsx("span", {
                        children: controller
                    }),
                    /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Typography, {
                        variant: "delta",
                        textColor: "primary600",
                        children: [
                            ".",
                            action
                        ]
                    })
                ]
            }),
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                hasRadius: true,
                background: "neutral0",
                borderColor: "neutral200",
                gap: 0,
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(MethodBox, {
                        background: colors.background,
                        borderColor: colors.border,
                        padding: 2,
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                            fontWeight: "bold",
                            textColor: colors.text,
                            children: method
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                        paddingLeft: 2,
                        paddingRight: 2,
                        children: map(formattedRoute, (value)=>/*#__PURE__*/ jsxRuntime.jsxs(designSystem.Typography, {
                                textColor: value.includes(':') ? 'neutral600' : 'neutral900',
                                children: [
                                    "/",
                                    value
                                ]
                            }, value))
                    })
                ]
            })
        ]
    });
}
BoundRoute.defaultProps = {
    route: {
        handler: 'Nocontroller.error',
        method: 'GET',
        path: '/there-is-no-path'
    }
};
BoundRoute.propTypes = {
    route: PropTypes.shape({
        handler: PropTypes.string,
        method: PropTypes.string,
        path: PropTypes.string
    })
};

module.exports = BoundRoute;
//# sourceMappingURL=index.js.map
