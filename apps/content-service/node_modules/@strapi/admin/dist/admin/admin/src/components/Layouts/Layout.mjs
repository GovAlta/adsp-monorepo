import { jsxs, jsx } from 'react/jsx-runtime';
import 'react';
import { Box, Flex } from '@strapi/design-system';
import { styled } from 'styled-components';
import { RESPONSIVE_DEFAULT_SPACING } from '../../constants/theme.mjs';
import { ActionLayout } from './ActionLayout.mjs';
import { ContentLayout } from './ContentLayout.mjs';
import { GridLayout } from './GridLayout.mjs';
import { HeaderLayout, BaseHeaderLayout } from './HeaderLayout.mjs';

const GridContainer = styled(Box)`
  max-width: 100%;
  display: grid;
  grid-template-columns: 1fr;
  padding: 0;

  ${({ theme })=>theme.breakpoints.medium} {
    grid-template-columns: ${({ $hasSideNav })=>$hasSideNav ? `auto 1fr` : '1fr'};
  }
`;
const SideNavContainer = styled(Flex)`
  display: none;
  background: ${({ theme })=>theme.colors.neutral0};

  ${({ theme })=>theme.breakpoints.medium} {
    display: block;
    box-shadow: none;
    transform: none;
  }
`;
const OverflowingItem = styled(Box)`
  overflow-x: hidden;

  ${({ theme })=>theme.breakpoints.medium} {
    transform: none;
    width: auto;
  }
`;
const RootLayout = ({ sideNav, children })=>/*#__PURE__*/ jsxs(GridContainer, {
        $hasSideNav: Boolean(sideNav),
        children: [
            sideNav && /*#__PURE__*/ jsx(SideNavContainer, {
                children: sideNav
            }),
            /*#__PURE__*/ jsx(OverflowingItem, {
                paddingBottom: RESPONSIVE_DEFAULT_SPACING,
                "data-strapi-main-content": true,
                children: children
            })
        ]
    });
const Layouts = {
    Root: RootLayout,
    Header: HeaderLayout,
    BaseHeader: BaseHeaderLayout,
    Grid: GridLayout,
    Action: ActionLayout,
    Content: ContentLayout
};

export { Layouts };
//# sourceMappingURL=Layout.mjs.map
