'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var map = require('lodash/map');
var tail = require('lodash/tail');
var reactIntl = require('react-intl');
var styled = require('styled-components');

const getMethodColor = (verb)=>{
    switch(verb){
        case 'POST':
            {
                return {
                    text: 'success600',
                    border: 'success200',
                    background: 'success100'
                };
            }
        case 'GET':
            {
                return {
                    text: 'secondary600',
                    border: 'secondary200',
                    background: 'secondary100'
                };
            }
        case 'PUT':
            {
                return {
                    text: 'warning600',
                    border: 'warning200',
                    background: 'warning100'
                };
            }
        case 'DELETE':
            {
                return {
                    text: 'danger600',
                    border: 'danger200',
                    background: 'danger100'
                };
            }
        default:
            {
                return {
                    text: 'neutral600',
                    border: 'neutral200',
                    background: 'neutral100'
                };
            }
    }
};
const MethodBox = styled.styled(designSystem.Box)`
  margin: -1px;
  border-radius: ${({ theme })=>theme.spaces[1]} 0 0 ${({ theme })=>theme.spaces[1]};
`;
const BoundRoute = ({ route = {
    handler: 'Nocontroller.error',
    method: 'GET',
    path: '/there-is-no-path'
} })=>{
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
                        id: 'Settings.apiTokens.createPage.BoundRoute.title',
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
};

exports.BoundRoute = BoundRoute;
//# sourceMappingURL=BoundRoute.js.map
