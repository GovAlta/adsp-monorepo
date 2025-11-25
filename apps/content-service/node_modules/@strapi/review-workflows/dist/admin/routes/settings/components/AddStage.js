'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var styledComponents = require('styled-components');

const AddStage = ({ children, ...props })=>{
    return /*#__PURE__*/ jsxRuntime.jsx(StyledButton, {
        tag: "button",
        background: "neutral0",
        borderColor: "neutral150",
        paddingBottom: 3,
        paddingLeft: 4,
        paddingRight: 4,
        paddingTop: 3,
        shadow: "filterShadow",
        ...props,
        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
            variant: "pi",
            fontWeight: "bold",
            children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                tag: "span",
                gap: 2,
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(icons.PlusCircle, {
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
const StyledButton = styledComponents.styled(designSystem.Box)`
  border-radius: 26px;
  color: ${({ theme })=>theme.colors.neutral500};

  &:hover {
    color: ${({ theme })=>theme.colors.primary600};
  }

  &:active {
    color: ${({ theme })=>theme.colors.primary600};
  }
`;

exports.AddStage = AddStage;
//# sourceMappingURL=AddStage.js.map
