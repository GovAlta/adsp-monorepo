import { jsx, jsxs } from 'react/jsx-runtime';
import { Divider, Box, Flex, Typography } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { styled } from 'styled-components';
import { Login } from '../../../../../../admin/src/pages/Auth/components/Login.mjs';
import { useGetProvidersQuery } from '../../../../../../admin/src/services/auth.mjs';
import { SSOProviders } from './SSOProviders.mjs';

const DividerFull = styled(Divider)`
  flex: 1;
`;
const LoginEE = (loginProps)=>{
    const { formatMessage } = useIntl();
    const { isLoading, data: providers = [] } = useGetProvidersQuery(undefined, {
        skip: !window.strapi.features.isEnabled(window.strapi.features.SSO)
    });
    if (!window.strapi.features.isEnabled(window.strapi.features.SSO) || !isLoading && providers.length === 0) {
        return /*#__PURE__*/ jsx(Login, {
            ...loginProps
        });
    }
    return /*#__PURE__*/ jsx(Login, {
        ...loginProps,
        children: /*#__PURE__*/ jsx(Box, {
            paddingTop: 7,
            children: /*#__PURE__*/ jsxs(Flex, {
                direction: "column",
                alignItems: "stretch",
                gap: 7,
                children: [
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
                                        id: 'Auth.login.sso.divider'
                                    })
                                })
                            }),
                            /*#__PURE__*/ jsx(DividerFull, {})
                        ]
                    }),
                    /*#__PURE__*/ jsx(SSOProviders, {
                        providers: providers,
                        displayAllProviders: false
                    })
                ]
            })
        })
    });
};

export { LoginEE };
//# sourceMappingURL=Login.mjs.map
