'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var styled = require('styled-components');
var Configuration = require('../../features/Configuration.js');

const BrandIconWrapper = styled.styled(designSystem.Flex)`
  svg,
  img {
    border-radius: ${({ theme })=>theme.borderRadius};
    object-fit: contain;
    height: 2.4rem;
    width: 2.4rem;
  }
`;
const NavBrand = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    const { logos: { menu } } = Configuration.useConfiguration('LeftMenu');
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
        padding: 3,
        children: /*#__PURE__*/ jsxRuntime.jsxs(BrandIconWrapper, {
            direction: "column",
            justifyContent: "center",
            width: "3.2rem",
            height: "3.2rem",
            children: [
                /*#__PURE__*/ jsxRuntime.jsx("img", {
                    src: menu.custom?.url || menu.default,
                    alt: formatMessage({
                        id: 'app.components.LeftMenu.logo.alt',
                        defaultMessage: 'Application logo'
                    }),
                    width: "100%",
                    height: "100%"
                }),
                /*#__PURE__*/ jsxRuntime.jsxs(designSystem.VisuallyHidden, {
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx("span", {
                            children: formatMessage({
                                id: 'app.components.LeftMenu.navbrand.title',
                                defaultMessage: 'Strapi Dashboard'
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx("span", {
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

exports.NavBrand = NavBrand;
//# sourceMappingURL=NavBrand.js.map
