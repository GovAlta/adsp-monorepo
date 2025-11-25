import { jsx, jsxs } from 'react/jsx-runtime';
import { Box, Flex, Typography, Divider } from '@strapi/design-system';
import { styled } from 'styled-components';

const IconBox = styled(Box)`
  height: 2.4rem;
  width: 2.4rem;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;

  svg {
    height: 1rem;
    width: 1rem;
  }

  svg path {
    fill: ${({ theme, color })=>theme.colors[`${color}600`]};
  }
`;
const ButtonBox = styled(Box)`
  border-radius: 0 0 ${({ theme })=>theme.borderRadius} ${({ theme })=>theme.borderRadius};
  display: block;
  width: 100%;
  border: none;
  position: relative;
`;
const NestedTFooter = ({ children, icon, color, ...props })=>{
    return /*#__PURE__*/ jsx(ButtonBox, {
        paddingBottom: 4,
        paddingTop: 4,
        paddingLeft: "6rem",
        tag: "button",
        type: "button",
        ...props,
        children: /*#__PURE__*/ jsxs(Flex, {
            children: [
                /*#__PURE__*/ jsx(IconBox, {
                    color: color,
                    "aria-hidden": true,
                    background: `${color}200`,
                    children: icon
                }),
                /*#__PURE__*/ jsx(Box, {
                    paddingLeft: 3,
                    children: /*#__PURE__*/ jsx(Typography, {
                        variant: "pi",
                        fontWeight: "bold",
                        textColor: `${color}600`,
                        children: children
                    })
                })
            ]
        })
    });
};
const TFooter = ({ children, icon, color, ...props })=>{
    return /*#__PURE__*/ jsxs("div", {
        children: [
            /*#__PURE__*/ jsx(Divider, {}),
            /*#__PURE__*/ jsx(ButtonBox, {
                tag: "button",
                background: `${color}100`,
                padding: 5,
                ...props,
                children: /*#__PURE__*/ jsxs(Flex, {
                    children: [
                        /*#__PURE__*/ jsx(IconBox, {
                            color: color,
                            "aria-hidden": true,
                            background: `${color}200`,
                            children: icon
                        }),
                        /*#__PURE__*/ jsx(Box, {
                            paddingLeft: 3,
                            children: /*#__PURE__*/ jsx(Typography, {
                                variant: "pi",
                                fontWeight: "bold",
                                textColor: `${color}600`,
                                children: children
                            })
                        })
                    ]
                })
            })
        ]
    });
};

export { NestedTFooter, TFooter };
//# sourceMappingURL=Footers.mjs.map
