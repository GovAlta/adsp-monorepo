'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var styled = require('styled-components');

const ContentBox = ({ title, subtitle, icon, iconBackground, endAction, titleEllipsis = false })=>{
    if (title && title.length > 70 && titleEllipsis) {
        title = `${title.substring(0, 70)}...`;
    }
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
        shadow: "tableShadow",
        hasRadius: true,
        padding: 6,
        background: "neutral0",
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(IconWrapper, {
                background: iconBackground,
                hasRadius: true,
                padding: 3,
                children: icon
            }),
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                direction: "column",
                alignItems: "stretch",
                gap: endAction ? 0 : 1,
                children: [
                    /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(TypographyWordBreak, {
                                fontWeight: "semiBold",
                                variant: "pi",
                                children: title
                            }),
                            endAction
                        ]
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                        textColor: "neutral600",
                        children: subtitle
                    })
                ]
            })
        ]
    });
};
const IconWrapper = styled.styled(designSystem.Flex)`
  margin-right: ${({ theme })=>theme.spaces[6]};

  svg {
    width: 3.2rem;
    height: 3.2rem;
  }
`;
const TypographyWordBreak = styled.styled(designSystem.Typography)`
  color: ${({ theme })=>theme.colors.neutral800};
  word-break: break-all;
`;

exports.ContentBox = ContentBox;
//# sourceMappingURL=ContentBox.js.map
