import { jsxs, jsx } from 'react/jsx-runtime';
import { Flex, Typography } from '@strapi/design-system';
import { styled } from 'styled-components';

const ContentBox = ({ title, subtitle, icon, iconBackground, endAction, titleEllipsis = false })=>{
    if (title && title.length > 70 && titleEllipsis) {
        title = `${title.substring(0, 70)}...`;
    }
    return /*#__PURE__*/ jsxs(Flex, {
        shadow: "tableShadow",
        hasRadius: true,
        padding: 6,
        background: "neutral0",
        children: [
            /*#__PURE__*/ jsx(IconWrapper, {
                background: iconBackground,
                hasRadius: true,
                padding: 3,
                children: icon
            }),
            /*#__PURE__*/ jsxs(Flex, {
                direction: "column",
                alignItems: "stretch",
                gap: endAction ? 0 : 1,
                children: [
                    /*#__PURE__*/ jsxs(Flex, {
                        children: [
                            /*#__PURE__*/ jsx(TypographyWordBreak, {
                                fontWeight: "semiBold",
                                variant: "pi",
                                children: title
                            }),
                            endAction
                        ]
                    }),
                    /*#__PURE__*/ jsx(Typography, {
                        textColor: "neutral600",
                        children: subtitle
                    })
                ]
            })
        ]
    });
};
const IconWrapper = styled(Flex)`
  margin-right: ${({ theme })=>theme.spaces[6]};

  svg {
    width: 3.2rem;
    height: 3.2rem;
  }
`;
const TypographyWordBreak = styled(Typography)`
  color: ${({ theme })=>theme.colors.neutral800};
  word-break: break-all;
`;

export { ContentBox };
//# sourceMappingURL=ContentBox.mjs.map
