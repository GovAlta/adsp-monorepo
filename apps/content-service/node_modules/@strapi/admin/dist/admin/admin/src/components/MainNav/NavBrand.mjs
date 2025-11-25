import { jsx, jsxs } from 'react/jsx-runtime';
import { Flex, Box, VisuallyHidden } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { styled } from 'styled-components';
import { useConfiguration } from '../../features/Configuration.mjs';

const BrandIconWrapper = styled(Flex)`
  svg,
  img {
    border-radius: ${({ theme })=>theme.borderRadius};
    object-fit: contain;
    height: 2.4rem;
    width: 2.4rem;
  }
`;
const NavBrand = ()=>{
    const { formatMessage } = useIntl();
    const { logos: { menu } } = useConfiguration('LeftMenu');
    return /*#__PURE__*/ jsx(Box, {
        padding: 3,
        children: /*#__PURE__*/ jsxs(BrandIconWrapper, {
            direction: "column",
            justifyContent: "center",
            width: "3.2rem",
            height: "3.2rem",
            children: [
                /*#__PURE__*/ jsx("img", {
                    src: menu.custom?.url || menu.default,
                    alt: formatMessage({
                        id: 'app.components.LeftMenu.logo.alt',
                        defaultMessage: 'Application logo'
                    }),
                    width: "100%",
                    height: "100%"
                }),
                /*#__PURE__*/ jsxs(VisuallyHidden, {
                    children: [
                        /*#__PURE__*/ jsx("span", {
                            children: formatMessage({
                                id: 'app.components.LeftMenu.navbrand.title',
                                defaultMessage: 'Strapi Dashboard'
                            })
                        }),
                        /*#__PURE__*/ jsx("span", {
                            children: formatMessage({
                                id: 'app.components.LeftMenu.navbrand.workplace',
                                defaultMessage: 'Workplace'
                            })
                        })
                    ]
                })
            ]
        })
    });
};

export { NavBrand };
//# sourceMappingURL=NavBrand.mjs.map
