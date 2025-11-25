'use strict';

var jsxRuntime = require('react/jsx-runtime');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var styledComponents = require('styled-components');

const ComponentDragPreview = ({ displayedValue })=>{
    const isDesktop = strapiAdmin.useIsDesktop();
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
        background: "neutral0",
        borderColor: "neutral200",
        justifyContent: "space-between",
        gap: 3,
        padding: 3,
        width: "30rem",
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(ToggleButton, {
                type: "button",
                children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                    gap: 6,
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(DropdownIconWrapper, {
                            alignItems: "center",
                            justifyContent: "center",
                            background: "neutral200",
                            height: "3.2rem",
                            width: "3.2rem",
                            children: /*#__PURE__*/ jsxRuntime.jsx(Icons.CaretDown, {})
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                            maxWidth: "15rem",
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                textColor: "neutral700",
                                ellipsis: true,
                                children: displayedValue
                            })
                        })
                    ]
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                gap: 2,
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                        withTooltip: false,
                        label: "",
                        variant: "ghost",
                        children: /*#__PURE__*/ jsxRuntime.jsx(Icons.Trash, {})
                    }),
                    isDesktop && /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                        withTooltip: false,
                        label: "",
                        variant: "ghost",
                        children: /*#__PURE__*/ jsxRuntime.jsx(Icons.Drag, {})
                    })
                ]
            })
        ]
    });
};
const DropdownIconWrapper = styledComponents.styled(designSystem.Flex)`
  border-radius: 50%;

  svg {
    height: 0.6rem;
    width: 1.1rem;
    > path {
      fill: ${({ theme })=>theme.colors.neutral600};
    }
  }
`;
// TODO: we shouldn't have to reset a whole button
const ToggleButton = styledComponents.styled.button`
  border: none;
  background: transparent;
  display: block;
  width: 100%;
  text-align: unset;
  padding: 0;
`;

exports.ComponentDragPreview = ComponentDragPreview;
//# sourceMappingURL=ComponentDragPreview.js.map
