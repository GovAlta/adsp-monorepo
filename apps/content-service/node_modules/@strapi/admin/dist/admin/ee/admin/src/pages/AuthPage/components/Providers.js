'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var styled = require('styled-components');
var UnauthenticatedLogo = require('../../../../../../admin/src/components/UnauthenticatedLogo.js');
var UnauthenticatedLayout = require('../../../../../../admin/src/layouts/UnauthenticatedLayout.js');
var auth = require('../../../../../../admin/src/services/auth.js');
var SSOProviders = require('./SSOProviders.js');

const Providers = ()=>{
    const navigate = reactRouterDom.useNavigate();
    const { formatMessage } = reactIntl.useIntl();
    const { isLoading, data: providers = [] } = auth.useGetProvidersQuery(undefined, {
        skip: !window.strapi.features.isEnabled(window.strapi.features.SSO)
    });
    const handleClick = ()=>{
        navigate('/auth/login');
    };
    if (!window.strapi.features.isEnabled(window.strapi.features.SSO) || !isLoading && providers.length === 0) {
        return /*#__PURE__*/ jsxRuntime.jsx(reactRouterDom.Navigate, {
            to: "/auth/login"
        });
    }
    return /*#__PURE__*/ jsxRuntime.jsx(UnauthenticatedLayout.UnauthenticatedLayout, {
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Main, {
            children: [
                /*#__PURE__*/ jsxRuntime.jsxs(UnauthenticatedLayout.LayoutContent, {
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsxs(UnauthenticatedLayout.Column, {
                            children: [
                                /*#__PURE__*/ jsxRuntime.jsx(UnauthenticatedLogo.Logo, {}),
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                    paddingTop: 6,
                                    paddingBottom: 1,
                                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                        tag: "h1",
                                        variant: "alpha",
                                        children: formatMessage({
                                            id: 'Auth.form.welcome.title'
                                        })
                                    })
                                }),
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                    paddingBottom: 7,
                                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                        variant: "epsilon",
                                        textColor: "neutral600",
                                        children: formatMessage({
                                            id: 'Auth.login.sso.subtitle'
                                        })
                                    })
                                })
                            ]
                        }),
                        /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                            direction: "column",
                            alignItems: "stretch",
                            gap: 7,
                            children: [
                                isLoading ? /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                                    justifyContent: "center",
                                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Loader, {
                                        children: formatMessage({
                                            id: 'Auth.login.sso.loading'
                                        })
                                    })
                                }) : /*#__PURE__*/ jsxRuntime.jsx(SSOProviders.SSOProviders, {
                                    providers: providers
                                }),
                                /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                    children: [
                                        /*#__PURE__*/ jsxRuntime.jsx(DividerFull, {}),
                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                            paddingLeft: 3,
                                            paddingRight: 3,
                                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                variant: "sigma",
                                                textColor: "neutral600",
                                                children: formatMessage({
                                                    id: 'or'
                                                })
                                            })
                                        }),
                                        /*#__PURE__*/ jsxRuntime.jsx(DividerFull, {})
                                    ]
                                }),
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                    fullWidth: true,
                                    size: "L",
                                    onClick: handleClick,
                                    children: formatMessage({
                                        id: 'Auth.form.button.login.strapi'
                                    })
                                })
                            ]
                        })
                    ]
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                    justifyContent: "center",
                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                        paddingTop: 4,
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Link, {
                            tag: reactRouterDom.NavLink,
                            to: "/auth/forgot-password",
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                variant: "pi",
                                children: formatMessage({
                                    id: 'Auth.link.forgot-password'
                                })
                            })
                        })
                    })
                })
            ]
        })
    });
};
const DividerFull = styled.styled(designSystem.Divider)`
  flex: 1;
`;

exports.Providers = Providers;
//# sourceMappingURL=Providers.js.map
