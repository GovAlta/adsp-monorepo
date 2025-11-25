import { jsx, jsxs } from 'react/jsx-runtime';
import 'react';
import { Button, Flex, Typography } from '@strapi/design-system';
import { PlusCircle } from '@strapi/icons';
import { styled } from 'styled-components';

const AddComponentButton = ({ hasError, isDisabled, isOpen, children, onClick })=>{
    return /*#__PURE__*/ jsx(StyledButton, {
        type: "button",
        onClick: onClick,
        disabled: isDisabled,
        background: "neutral0",
        style: {
            cursor: isDisabled ? 'not-allowed' : 'pointer'
        },
        variant: "tertiary",
        children: /*#__PURE__*/ jsxs(Flex, {
            tag: "span",
            gap: 2,
            children: [
                /*#__PURE__*/ jsx(StyledAddIcon, {
                    "aria-hidden": true,
                    $isOpen: isOpen,
                    $hasError: hasError && !isOpen
                }),
                /*#__PURE__*/ jsx(Typography, {
                    variant: "pi",
                    fontWeight: "bold",
                    textColor: hasError && !isOpen ? 'danger600' : 'neutral600',
                    children: children
                })
            ]
        })
    });
};
const StyledAddIcon = styled(PlusCircle)`
  height: ${({ theme })=>theme.spaces[6]};
  width: ${({ theme })=>theme.spaces[6]};
  transform: ${({ $isOpen })=>$isOpen ? 'rotate(45deg)' : 'rotate(0deg)'};

  > circle {
    fill: ${({ theme, $hasError })=>$hasError ? theme.colors.danger200 : theme.colors.neutral150};
  }
  > path {
    fill: ${({ theme, $hasError })=>$hasError ? theme.colors.danger600 : theme.colors.neutral500};
  }
`;
const StyledButton = styled(Button)`
  padding-left: ${({ theme })=>theme.spaces[3]};
  border-radius: 26px;
  box-shadow: ${({ theme })=>theme.shadows.filterShadow};
  height: 5rem;
`;

export { AddComponentButton };
//# sourceMappingURL=AddComponentButton.mjs.map
