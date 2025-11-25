import { jsx, jsxs } from 'react/jsx-runtime';
import { Divider, Main, Box, Typography, Flex, Loader, Button, Link } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { useNavigate, Navigate, NavLink } from 'react-router-dom';
import { styled } from 'styled-components';
import { Logo } from '../../../../../../admin/src/components/UnauthenticatedLogo.mjs';
import { UnauthenticatedLayout, LayoutContent, Column } from '../../../../../../admin/src/layouts/UnauthenticatedLayout.mjs';
import { useGetProvidersQuery } from '../../../../../../admin/src/services/auth.mjs';
import { SSOProviders } from './SSOProviders.mjs';

const Providers = ()=>{
    const navigate = useNavigate();
    const { formatMessage } = useIntl();
    const { isLoading, data: providers = [] } = useGetProvidersQuery(undefined, {
        skip: !window.strapi.features.isEnabled(window.strapi.features.SSO)
    });
    const handleClick = ()=>{
        navigate('/auth/login');
    };
    if (!window.strapi.features.isEnabled(window.strapi.features.SSO) || !isLoading && providers.length === 0) {
        return /*#__PURE__*/ jsx(Navigate, {
            to: "/auth/login"
        });
    }
    return /*#__PURE__*/ jsx(UnauthenticatedLayout, {
        children: /*#__PURE__*/ jsxs(Main, {
            children: [
                /*#__PURE__*/ jsxs(LayoutContent, {
                    children: [
                        /*#__PURE__*/ jsxs(Column, {
                            children: [
                                /*#__PURE__*/ jsx(Logo, {}),
                                /*#__PURE__*/ jsx(Box, {
                                    paddingTop: 6,
                                    paddingBottom: 1,
                                    children: /*#__PURE__*/ jsx(Typography, {
                                        tag: "h1",
                                        variant: "alpha",
                                        children: formatMessage({
                                            id: 'Auth.form.welcome.title'
                                        })
                                    })
                                }),
                                /*#__PURE__*/ jsx(Box, {
                                    paddingBottom: 7,
                                    children: /*#__PURE__*/ jsx(Typography, {
                                        variant: "epsilon",
                                        textColor: "neutral600",
                                        children: formatMessage({
                                            id: 'Auth.login.sso.subtitle'
                                        })
                                    })
                                })
                            ]
                        }),
                        /*#__PURE__*/ jsxs(Flex, {
                            direction: "column",
                            alignItems: "stretch",
                            gap: 7,
                            children: [
                                isLoading ? /*#__PURE__*/ jsx(Flex, {
                                    justifyContent: "center",
                                    children: /*#__PURE__*/ jsx(Loader, {
                                        children: formatMessage({
                                            id: 'Auth.login.sso.loading'
                                        })
                                    })
                                }) : /*#__PURE__*/ jsx(SSOProviders, {
                                    providers: providers
                                }),
                                /*#__PURE__*/ jsxs(Flex, {
                                    children: [
                                        /*#__PURE__*/ jsx(DividerFull, {}),
                                        /*#__PURE__*/ jsx(Box, {
                                            paddingLeft: 3,
                                            paddingRight: 3,
                                            children: /*#__PURE__*/ jsx(Typography, {
                                                variant: "sigma",
                                                textColor: "neutral600",
                                                children: formatMessage({
                                                    id: 'or'
                                                })
                                            })
                                        }),
                                        /*#__PURE__*/ jsx(DividerFull, {})
                                    ]
                                }),
                                /*#__PURE__*/ jsx(Button, {
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
                /*#__PURE__*/ jsx(Flex, {
                    justifyContent: "center",
                    children: /*#__PURE__*/ jsx(Box, {
                        paddingTop: 4,
                        children: /*#__PURE__*/ jsx(Link, {
                            tag: NavLink,
                            to: "/auth/forgot-password",
                            children: /*#__PURE__*/ jsx(Typography, {
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
const DividerFull = styled(Divider)`
  flex: 1;
`;

export { Providers };
//# sourceMappingURL=Providers.mjs.map
