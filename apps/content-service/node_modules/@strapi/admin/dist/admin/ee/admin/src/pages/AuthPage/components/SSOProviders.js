'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var styled = require('styled-components');

const SSOProviders = ({ providers, displayAllProviders })=>{
    const { formatMessage } = reactIntl.useIntl();
    if (displayAllProviders) {
        return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Root, {
            gap: 4,
            children: providers.map((provider)=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                    col: 4,
                    direction: "column",
                    alignItems: "stretch",
                    children: /*#__PURE__*/ jsxRuntime.jsx(SSOProviderButton, {
                        provider: provider
                    })
                }, provider.uid))
        });
    }
    if (providers.length > 2 && !displayAllProviders) {
        return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Grid.Root, {
            gap: 4,
            children: [
                providers.slice(0, 2).map((provider)=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                        col: 4,
                        direction: "column",
                        alignItems: "stretch",
                        children: /*#__PURE__*/ jsxRuntime.jsx(SSOProviderButton, {
                            provider: provider
                        })
                    }, provider.uid)),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                    col: 4,
                    direction: "column",
                    alignItems: "stretch",
                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tooltip, {
                        label: formatMessage({
                            id: 'global.see-more'
                        }),
                        children: /*#__PURE__*/ jsxRuntime.jsx(SSOButton, {
                            as: reactRouterDom.Link,
                            to: "/auth/providers",
                            children: /*#__PURE__*/ jsxRuntime.jsx("span", {
                                "aria-hidden": true,
                                children: "•••"
                            })
                        })
                    })
                })
            ]
        });
    }
    return /*#__PURE__*/ jsxRuntime.jsx(SSOProvidersWrapper, {
        justifyContent: "center",
        children: providers.map((provider)=>/*#__PURE__*/ jsxRuntime.jsx(SSOProviderButton, {
                provider: provider
            }, provider.uid))
    });
};
const SSOProvidersWrapper = styled.styled(designSystem.Flex)`
  & a:not(:first-child):not(:last-child) {
    margin: 0 ${({ theme })=>theme.spaces[2]};
  }
  & a:first-child {
    margin-right: ${({ theme })=>theme.spaces[2]};
  }
  & a:last-child {
    margin-left: ${({ theme })=>theme.spaces[2]};
  }
`;
const SSOProviderButton = ({ provider })=>{
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tooltip, {
        label: provider.displayName,
        children: /*#__PURE__*/ jsxRuntime.jsx(SSOButton, {
            href: `${window.strapi.backendURL}/admin/connect/${provider.uid}`,
            children: provider.icon ? /*#__PURE__*/ jsxRuntime.jsx("img", {
                src: provider.icon,
                "aria-hidden": true,
                alt: "",
                height: "32px"
            }) : /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                children: provider.displayName
            })
        })
    });
};
const SSOButton = styled.styled.a`
  width: 13.6rem;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 4.8rem;
  border: 1px solid ${({ theme })=>theme.colors.neutral150};
  border-radius: ${({ theme })=>theme.borderRadius};
  text-decoration: inherit;
  &:link {
    text-decoration: none;
  }
  color: ${({ theme })=>theme.colors.neutral600};
`;

exports.SSOProviders = SSOProviders;
//# sourceMappingURL=SSOProviders.js.map
