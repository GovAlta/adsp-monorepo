import { jsx, jsxs } from 'react/jsx-runtime';
import { Flex, Grid, Tooltip, Typography } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { styled } from 'styled-components';

const SSOProviders = ({ providers, displayAllProviders })=>{
    const { formatMessage } = useIntl();
    if (displayAllProviders) {
        return /*#__PURE__*/ jsx(Grid.Root, {
            gap: 4,
            children: providers.map((provider)=>/*#__PURE__*/ jsx(Grid.Item, {
                    col: 4,
                    direction: "column",
                    alignItems: "stretch",
                    children: /*#__PURE__*/ jsx(SSOProviderButton, {
                        provider: provider
                    })
                }, provider.uid))
        });
    }
    if (providers.length > 2 && !displayAllProviders) {
        return /*#__PURE__*/ jsxs(Grid.Root, {
            gap: 4,
            children: [
                providers.slice(0, 2).map((provider)=>/*#__PURE__*/ jsx(Grid.Item, {
                        col: 4,
                        direction: "column",
                        alignItems: "stretch",
                        children: /*#__PURE__*/ jsx(SSOProviderButton, {
                            provider: provider
                        })
                    }, provider.uid)),
                /*#__PURE__*/ jsx(Grid.Item, {
                    col: 4,
                    direction: "column",
                    alignItems: "stretch",
                    children: /*#__PURE__*/ jsx(Tooltip, {
                        label: formatMessage({
                            id: 'global.see-more'
                        }),
                        children: /*#__PURE__*/ jsx(SSOButton, {
                            as: Link,
                            to: "/auth/providers",
                            children: /*#__PURE__*/ jsx("span", {
                                "aria-hidden": true,
                                children: "•••"
                            })
                        })
                    })
                })
            ]
        });
    }
    return /*#__PURE__*/ jsx(SSOProvidersWrapper, {
        justifyContent: "center",
        children: providers.map((provider)=>/*#__PURE__*/ jsx(SSOProviderButton, {
                provider: provider
            }, provider.uid))
    });
};
const SSOProvidersWrapper = styled(Flex)`
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
    return /*#__PURE__*/ jsx(Tooltip, {
        label: provider.displayName,
        children: /*#__PURE__*/ jsx(SSOButton, {
            href: `${window.strapi.backendURL}/admin/connect/${provider.uid}`,
            children: provider.icon ? /*#__PURE__*/ jsx("img", {
                src: provider.icon,
                "aria-hidden": true,
                alt: "",
                height: "32px"
            }) : /*#__PURE__*/ jsx(Typography, {
                children: provider.displayName
            })
        })
    });
};
const SSOButton = styled.a`
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

export { SSOProviders };
//# sourceMappingURL=SSOProviders.mjs.map
