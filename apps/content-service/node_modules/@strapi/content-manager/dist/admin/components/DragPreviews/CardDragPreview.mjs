import { jsxs, jsx } from 'react/jsx-runtime';
import { useIsDesktop } from '@strapi/admin/strapi-admin';
import { Flex, Typography } from '@strapi/design-system';
import { Drag, Pencil, Cross } from '@strapi/icons';
import { styled } from 'styled-components';

const CardDragPreview = ({ label, isSibling = false })=>{
    const isDesktop = useIsDesktop();
    return /*#__PURE__*/ jsxs(FieldContainer, {
        background: isSibling ? 'neutral100' : 'primary100',
        display: "inline-flex",
        gap: 3,
        hasRadius: true,
        justifyContent: "space-between",
        $isSibling: isSibling,
        "max-height": `3.2rem`,
        maxWidth: "min-content",
        children: [
            /*#__PURE__*/ jsxs(Flex, {
                gap: 3,
                children: [
                    isDesktop && /*#__PURE__*/ jsx(DragButton, {
                        alignItems: "center",
                        cursor: "all-scroll",
                        padding: 3,
                        children: /*#__PURE__*/ jsx(Drag, {})
                    }),
                    /*#__PURE__*/ jsx(Typography, {
                        textColor: isSibling ? undefined : 'primary600',
                        fontWeight: "bold",
                        ellipsis: true,
                        maxWidth: "7.2rem",
                        children: label
                    })
                ]
            }),
            /*#__PURE__*/ jsxs(Flex, {
                children: [
                    /*#__PURE__*/ jsx(ActionBox, {
                        alignItems: "center",
                        children: /*#__PURE__*/ jsx(Pencil, {})
                    }),
                    /*#__PURE__*/ jsx(ActionBox, {
                        alignItems: "center",
                        children: /*#__PURE__*/ jsx(Cross, {})
                    })
                ]
            })
        ]
    });
};
const ActionBox = styled(Flex)`
  height: ${({ theme })=>theme.spaces[7]};

  &:last-child {
    padding: 0 ${({ theme })=>theme.spaces[3]};
  }
`;
const DragButton = styled(ActionBox)`
  border-right: 1px solid ${({ theme })=>theme.colors.primary200};

  svg {
    width: 1.2rem;
    height: 1.2rem;
  }
`;
const FieldContainer = styled(Flex)`
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

export { CardDragPreview };
//# sourceMappingURL=CardDragPreview.mjs.map
