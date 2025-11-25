'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var UnauthenticatedLogo = require('../../../components/UnauthenticatedLogo.js');
var UnauthenticatedLayout = require('../../../layouts/UnauthenticatedLayout.js');

const ForgotPasswordSuccess = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsx(UnauthenticatedLayout.UnauthenticatedLayout, {
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Main, {
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(UnauthenticatedLayout.LayoutContent, {
                    children: /*#__PURE__*/ jsxRuntime.jsxs(UnauthenticatedLayout.Column, {
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(UnauthenticatedLogo.Logo, {}),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                paddingTop: 6,
                                paddingBottom: 7,
                                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                    tag: "h1",
                                    variant: "alpha",
                                    children: formatMessage({
                                        id: 'app.containers.AuthPage.ForgotPasswordSuccess.title',
                                        defaultMessage: 'Email sent'
                                    })
                                })
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                children: formatMessage({
                                    id: 'app.containers.AuthPage.ForgotPasswordSuccess.text.email',
                                    defaultMessage: 'It can take a few minutes to receive your password recovery link.'
                                })
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                paddingTop: 4,
                                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                    children: formatMessage({
                                        id: 'app.containers.AuthPage.ForgotPasswordSuccess.text.contact-admin',
                                        defaultMessage: 'If you do not receive this link, please contact your administrator.'
                                    })
                                })
                            })
                        ]
                    })
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                    justifyContent: "center",
                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                        paddingTop: 4,
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Link, {
                            tag: reactRouterDom.NavLink,
                            to: "/auth/login",
                            children: formatMessage({
                                id: 'Auth.link.signin',
                                defaultMessage: 'Sign in'
                            })
                        })
                    })
                })
            ]
        })
    });
};

exports.ForgotPasswordSuccess = ForgotPasswordSuccess;
//# sourceMappingURL=ForgotPasswordSuccess.js.map
