'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var styled = require('styled-components');
var Login = require('../../../../../../admin/src/pages/Auth/components/Login.js');
var auth = require('../../../../../../admin/src/services/auth.js');
var SSOProviders = require('./SSOProviders.js');

const DividerFull = styled.styled(designSystem.Divider)`
  flex: 1;
`;
const LoginEE = (loginProps)=>{
    const { formatMessage } = reactIntl.useIntl();
    const { isLoading, data: providers = [] } = auth.useGetProvidersQuery(undefined, {
        skip: !window.strapi.features.isEnabled(window.strapi.features.SSO)
    });
    if (!window.strapi.features.isEnabled(window.strapi.features.SSO) || !isLoading && providers.length === 0) {
        return /*#__PURE__*/ jsxRuntime.jsx(Login.Login, {
            ...loginProps
        });
    }
    return /*#__PURE__*/ jsxRuntime.jsx(Login.Login, {
        ...loginProps,
        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
            paddingTop: 7,
            children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                direction: "column",
                alignItems: "stretch",
                gap: 7,
                children: [
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
                                        id: 'Auth.login.sso.divider'
                                    })
                                })
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(DividerFull, {})
                        ]
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(SSOProviders.SSOProviders, {
                        providers: providers,
                        displayAllProviders: false
                    })
                ]
            })
        })
    });
};

exports.LoginEE = LoginEE;
//# sourceMappingURL=Login.js.map
