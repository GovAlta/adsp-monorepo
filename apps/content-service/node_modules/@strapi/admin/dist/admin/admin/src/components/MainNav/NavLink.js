'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var designSystem = require('@strapi/design-system');
var reactRouterDom = require('react-router-dom');
var styled = require('styled-components');

/* -------------------------------------------------------------------------------------------------
 * Link
 * -----------------------------------------------------------------------------------------------*/ const MainNavLinkWrapper = styled.styled(reactRouterDom.NavLink)`
  text-decoration: none;
  display: flex;
  align-items: center;
  border-radius: ${({ theme })=>theme.borderRadius};
  background: ${({ theme })=>theme.colors.neutral0};
  color: ${({ theme })=>theme.colors.neutral500};
  position: relative;
  width: 100%;
  padding-block: 0.6rem;
  padding-inline: 0.6rem;

  &:hover {
    svg path {
      fill: ${({ theme })=>theme.colors.neutral600};
    }
    background: ${({ theme })=>theme.colors.neutral100};
  }

  &.active {
    svg path {
      fill: ${({ theme })=>theme.colors.primary600};
    }
    background: ${({ theme })=>theme.colors.primary100};
  }
`;
const LinkImpl = ({ children, ...props })=>/*#__PURE__*/ jsxRuntime.jsx(MainNavLinkWrapper, {
        ...props,
        children: children
    });
/* -------------------------------------------------------------------------------------------------
 * Tooltip
 * -----------------------------------------------------------------------------------------------*/ const TooltipImpl = ({ children, label, position = 'right' })=>{
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tooltip, {
        side: position,
        label: label,
        delayDuration: 0,
        children: /*#__PURE__*/ jsxRuntime.jsx("span", {
            children: children
        })
    });
};
/* -------------------------------------------------------------------------------------------------
 * Icon
 * -----------------------------------------------------------------------------------------------*/ const IconImpl = ({ label, children })=>{
    if (!children) {
        return null;
    }
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.AccessibleIcon, {
        label: label,
        children: children
    });
};
/* -------------------------------------------------------------------------------------------------
 * Badge
 * -----------------------------------------------------------------------------------------------*/ const CustomBadge = styled.styled(designSystem.Badge)`
  /* override default badge styles to change the border radius of the Base element in the Design System */
  border-radius: ${({ theme })=>theme.spaces[10]};
  height: 2rem;
`;
const BadgeImpl = ({ children, label, ...props })=>{
    if (!children) {
        return null;
    }
    return /*#__PURE__*/ jsxRuntime.jsx(CustomBadge, {
        position: "absolute",
        top: "-0.8rem",
        left: "1.7rem",
        "aria-label": label,
        active: false,
        ...props,
        children: children
    });
};
/* -------------------------------------------------------------------------------------------------
 * EXPORTS
 * -----------------------------------------------------------------------------------------------*/ const NavLink = {
    Link: LinkImpl,
    Tooltip: TooltipImpl,
    Icon: IconImpl,
    Badge: BadgeImpl
};

exports.NavLink = NavLink;
//# sourceMappingURL=NavLink.js.map
