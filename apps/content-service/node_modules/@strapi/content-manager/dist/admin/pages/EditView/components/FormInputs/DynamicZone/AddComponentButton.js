'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var styledComponents = require('styled-components');

const AddComponentButton = ({ hasError, isDisabled, isOpen, children, onClick })=>{
    return /*#__PURE__*/ jsxRuntime.jsx(StyledButton, {
        type: "button",
        onClick: onClick,
        disabled: isDisabled,
        background: "neutral0",
        style: {
            cursor: isDisabled ? 'not-allowed' : 'pointer'
        },
        variant: "tertiary",
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
            tag: "span",
            gap: 2,
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(StyledAddIcon, {
                    "aria-hidden": true,
                    $isOpen: isOpen,
                    $hasError: hasError && !isOpen
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                    variant: "pi",
                    fontWeight: "bold",
                    textColor: hasError && !isOpen ? 'danger600' : 'neutral600',
                    children: children
                })
            ]
        })
    });
};
const StyledAddIcon = styledComponents.styled(Icons.PlusCircle)`
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
const StyledButton = styledComponents.styled(designSystem.Button)`
  padding-left: ${({ theme })=>theme.spaces[3]};
  border-radius: 26px;
  box-shadow: ${({ theme })=>theme.shadows.filterShadow};
  height: 5rem;
`;

exports.AddComponentButton = AddComponentButton;
//# sourceMappingURL=AddComponentButton.js.map
