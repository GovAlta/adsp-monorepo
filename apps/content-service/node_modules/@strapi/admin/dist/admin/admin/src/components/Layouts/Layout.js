'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var designSystem = require('@strapi/design-system');
var styled = require('styled-components');
var theme = require('../../constants/theme.js');
var ActionLayout = require('./ActionLayout.js');
var ContentLayout = require('./ContentLayout.js');
var GridLayout = require('./GridLayout.js');
var HeaderLayout = require('./HeaderLayout.js');

const GridContainer = styled.styled(designSystem.Box)`
  max-width: 100%;
  display: grid;
  grid-template-columns: 1fr;
  padding: 0;

  ${({ theme })=>theme.breakpoints.medium} {
    grid-template-columns: ${({ $hasSideNav })=>$hasSideNav ? `auto 1fr` : '1fr'};
  }
`;
const SideNavContainer = styled.styled(designSystem.Flex)`
  display: none;
  background: ${({ theme })=>theme.colors.neutral0};

  ${({ theme })=>theme.breakpoints.medium} {
    display: block;
    box-shadow: none;
    transform: none;
  }
`;
const OverflowingItem = styled.styled(designSystem.Box)`
  overflow-x: hidden;

  ${({ theme })=>theme.breakpoints.medium} {
    transform: none;
    width: auto;
  }
`;
const RootLayout = ({ sideNav, children })=>/*#__PURE__*/ jsxRuntime.jsxs(GridContainer, {
        $hasSideNav: Boolean(sideNav),
        children: [
            sideNav && /*#__PURE__*/ jsxRuntime.jsx(SideNavContainer, {
                children: sideNav
            }),
            /*#__PURE__*/ jsxRuntime.jsx(OverflowingItem, {
                paddingBottom: theme.RESPONSIVE_DEFAULT_SPACING,
                "data-strapi-main-content": true,
                children: children
            })
        ]
    });
const Layouts = {
    Root: RootLayout,
    Header: HeaderLayout.HeaderLayout,
    BaseHeader: HeaderLayout.BaseHeaderLayout,
    Grid: GridLayout.GridLayout,
    Action: ActionLayout.ActionLayout,
    Content: ContentLayout.ContentLayout
};

exports.Layouts = Layouts;
//# sourceMappingURL=Layout.js.map
