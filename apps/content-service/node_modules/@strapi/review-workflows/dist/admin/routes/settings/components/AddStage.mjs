import { jsx, jsxs } from 'react/jsx-runtime';
import { Box, Typography, Flex } from '@strapi/design-system';
import { PlusCircle } from '@strapi/icons';
import { styled } from 'styled-components';

const AddStage = ({ children, ...props })=>{
    return /*#__PURE__*/ jsx(StyledButton, {
        tag: "button",
        background: "neutral0",
        borderColor: "neutral150",
        paddingBottom: 3,
        paddingLeft: 4,
        paddingRight: 4,
        paddingTop: 3,
        shadow: "filterShadow",
        ...props,
        children: /*#__PURE__*/ jsx(Typography, {
            variant: "pi",
            fontWeight: "bold",
            children: /*#__PURE__*/ jsxs(Flex, {
                tag: "span",
                gap: 2,
                children: [
                    /*#__PURE__*/ jsx(PlusCircle, {
                        width: "2.4rem",
                        height: "2.4rem",
                        "aria-hidden": true
                    }),
                    children
                ]
            })
        })
    });
};
const StyledButton = styled(Box)`
  border-radius: 26px;
  color: ${({ theme })=>theme.colors.neutral500};

  &:hover {
    color: ${({ theme })=>theme.colors.primary600};
  }

  &:active {
    color: ${({ theme })=>theme.colors.primary600};
  }
`;

export { AddStage };
//# sourceMappingURL=AddStage.mjs.map
