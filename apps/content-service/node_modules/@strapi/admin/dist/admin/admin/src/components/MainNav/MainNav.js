'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var styled = require('styled-components');

const MainNavWrapper = styled.styled(designSystem.Flex)`
  border-bottom: 1px solid ${({ theme })=>theme.colors.neutral150};
  position: sticky;
  max-height: 100%;
  height: auto;
  z-index: 4;

  ${({ theme })=>theme.breakpoints.large} {
    border-bottom: none;
    border-right: 1px solid ${({ theme })=>theme.colors.neutral150};
    height: 100dvh;
  }
`;
const MainNav = (props)=>/*#__PURE__*/ jsxRuntime.jsx(MainNavWrapper, {
        alignItems: "normal",
        tag: "nav",
        background: "neutral0",
        direction: {
            initial: 'row',
            large: 'column'
        },
        top: 0,
        zIndex: 3,
        width: {
            initial: '100dvw',
            large: 10
        },
        ...props
    });

exports.MainNav = MainNav;
//# sourceMappingURL=MainNav.js.map
