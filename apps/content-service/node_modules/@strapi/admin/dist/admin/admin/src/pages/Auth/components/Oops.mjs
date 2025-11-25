import { jsx, jsxs } from 'react/jsx-runtime';
import * as React from 'react';
import { Main, Box, Typography, Flex, Link } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { useLocation, NavLink } from 'react-router-dom';
import { Logo } from '../../../components/UnauthenticatedLogo.mjs';
import { UnauthenticatedLayout, LayoutContent, Column } from '../../../layouts/UnauthenticatedLayout.mjs';

const Oops = ()=>{
    const { formatMessage } = useIntl();
    const { search: searchString } = useLocation();
    const query = React.useMemo(()=>new URLSearchParams(searchString), [
        searchString
    ]);
    const message = query.get('info') || formatMessage({
        id: 'Auth.components.Oops.text',
        defaultMessage: 'Your account has been suspended.'
    });
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
                                        id: 'Auth.components.Oops.title',
                                        defaultMessage: 'Oops...'
                                    })
                                })
                            }),
                            /*#__PURE__*/ jsx(Typography, {
                                children: message
                            }),
                            /*#__PURE__*/ jsx(Box, {
                                paddingTop: 4,
                                children: /*#__PURE__*/ jsx(Typography, {
                                    children: formatMessage({
                                        id: 'Auth.components.Oops.text.admin',
                                        defaultMessage: 'If this is a mistake, please contact your administrator.'
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

export { Oops };
//# sourceMappingURL=Oops.mjs.map
