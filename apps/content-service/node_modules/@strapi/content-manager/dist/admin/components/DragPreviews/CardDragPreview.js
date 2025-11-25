'use strict';

var jsxRuntime = require('react/jsx-runtime');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var styledComponents = require('styled-components');

const CardDragPreview = ({ label, isSibling = false })=>{
    const isDesktop = strapiAdmin.useIsDesktop();
    return /*#__PURE__*/ jsxRuntime.jsxs(FieldContainer, {
        background: isSibling ? 'neutral100' : 'primary100',
        display: "inline-flex",
        gap: 3,
        hasRadius: true,
        justifyContent: "space-between",
        $isSibling: isSibling,
        "max-height": `3.2rem`,
        maxWidth: "min-content",
        children: [
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                gap: 3,
                children: [
                    isDesktop && /*#__PURE__*/ jsxRuntime.jsx(DragButton, {
                        alignItems: "center",
                        cursor: "all-scroll",
                        padding: 3,
                        children: /*#__PURE__*/ jsxRuntime.jsx(Icons.Drag, {})
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                        textColor: isSibling ? undefined : 'primary600',
                        fontWeight: "bold",
                        ellipsis: true,
                        maxWidth: "7.2rem",
                        children: label
                    })
                ]
            }),
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(ActionBox, {
                        alignItems: "center",
                        children: /*#__PURE__*/ jsxRuntime.jsx(Icons.Pencil, {})
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(ActionBox, {
                        alignItems: "center",
                        children: /*#__PURE__*/ jsxRuntime.jsx(Icons.Cross, {})
                    })
                ]
            })
        ]
    });
};
const ActionBox = styledComponents.styled(designSystem.Flex)`
  height: ${({ theme })=>theme.spaces[7]};

  &:last-child {
    padding: 0 ${({ theme })=>theme.spaces[3]};
  }
`;
const DragButton = styledComponents.styled(ActionBox)`
  border-right: 1px solid ${({ theme })=>theme.colors.primary200};

  svg {
    width: 1.2rem;
    height: 1.2rem;
  }
`;
const FieldContainer = styledComponents.styled(designSystem.Flex)`
  border: 1px solid
    ${({ theme, $isSibling })=>$isSibling ? theme.colors.neutral150 : theme.colors.primary200};

  svg {
    width: 1rem;
    height: 1rem;

    path {
      fill: ${({ theme, $isSibling })=>$isSibling ? undefined : theme.colors.primary600};
    }
  }
`;

exports.CardDragPreview = CardDragPreview;
//# sourceMappingURL=CardDragPreview.js.map
