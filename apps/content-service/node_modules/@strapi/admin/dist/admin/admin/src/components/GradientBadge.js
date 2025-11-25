'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var styled = require('styled-components');

const GradientBadge = styled.styled(designSystem.Badge)`
  background: linear-gradient(
    90deg,
    ${({ theme })=>theme.colors.primary600} 0%,
    ${({ theme })=>theme.colors.alternative600} 121.48%
  );
  padding: 0.4rem 1rem;
`;
const GradientBadgeWithIcon = ({ label })=>{
    return /*#__PURE__*/ jsxRuntime.jsx(GradientBadge, {
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
            gap: 1,
            alignItems: "center",
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(icons.Lightning, {
                    width: 16,
                    height: 16,
                    fill: "neutral0"
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                    textColor: "neutral0",
                    children: label
                })
            ]
        })
    });
};

exports.GradientBadge = GradientBadgeWithIcon;
//# sourceMappingURL=GradientBadge.js.map
