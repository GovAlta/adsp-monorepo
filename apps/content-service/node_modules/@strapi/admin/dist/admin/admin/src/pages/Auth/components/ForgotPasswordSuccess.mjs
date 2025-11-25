import { jsx, jsxs } from 'react/jsx-runtime';
import { Main, Box, Typography, Flex, Link } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { NavLink } from 'react-router-dom';
import { Logo } from '../../../components/UnauthenticatedLogo.mjs';
import { UnauthenticatedLayout, LayoutContent, Column } from '../../../layouts/UnauthenticatedLayout.mjs';

const ForgotPasswordSuccess = ()=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsx(UnauthenticatedLayout, {
        children: /*#__PURE__*/ jsxs(Main, {
            children: [
                /*#__PURE__*/ jsx(LayoutContent, {
                    children: /*#__PURE__*/ jsxs(Column, {
                        children: [
                            /*#__PURE__*/ jsx(Logo, {}),
                            /*#__PURE__*/ jsx(Box, {
                                paddingTop: 6,
                                paddingBottom: 7,
                                children: /*#__PURE__*/ jsx(Typography, {
                                    tag: "h1",
                                    variant: "alpha",
                                    children: formatMessage({
                                        id: 'app.containers.AuthPage.ForgotPasswordSuccess.title',
                                        defaultMessage: 'Email sent'
                                    })
                                })
                            }),
                            /*#__PURE__*/ jsx(Typography, {
                                children: formatMessage({
                                    id: 'app.containers.AuthPage.ForgotPasswordSuccess.text.email',
                                    defaultMessage: 'It can take a few minutes to receive your password recovery link.'
                                })
                            }),
                            /*#__PURE__*/ jsx(Box, {
                                paddingTop: 4,
                                children: /*#__PURE__*/ jsx(Typography, {
                                    children: formatMessage({
                                        id: 'app.containers.AuthPage.ForgotPasswordSuccess.text.contact-admin',
                                        defaultMessage: 'If you do not receive this link, please contact your administrator.'
                                    })
                                })
                            })
                        ]
                    })
                }),
                /*#__PURE__*/ jsx(Flex, {
                    justifyContent: "center",
                    children: /*#__PURE__*/ jsx(Box, {
                        paddingTop: 4,
                        children: /*#__PURE__*/ jsx(Link, {
                            tag: NavLink,
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

export { ForgotPasswordSuccess };
//# sourceMappingURL=ForgotPasswordSuccess.mjs.map
