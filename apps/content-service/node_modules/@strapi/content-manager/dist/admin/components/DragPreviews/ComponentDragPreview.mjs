import { jsxs, jsx } from 'react/jsx-runtime';
import { useIsDesktop } from '@strapi/admin/strapi-admin';
import { Flex, Typography, IconButton } from '@strapi/design-system';
import { CaretDown, Trash, Drag } from '@strapi/icons';
import { styled } from 'styled-components';

const ComponentDragPreview = ({ displayedValue })=>{
    const isDesktop = useIsDesktop();
    return /*#__PURE__*/ jsxs(Flex, {
        background: "neutral0",
        borderColor: "neutral200",
        justifyContent: "space-between",
        gap: 3,
        padding: 3,
        width: "30rem",
        children: [
            /*#__PURE__*/ jsx(ToggleButton, {
                type: "button",
                children: /*#__PURE__*/ jsxs(Flex, {
                    gap: 6,
                    children: [
                        /*#__PURE__*/ jsx(DropdownIconWrapper, {
                            alignItems: "center",
                            justifyContent: "center",
                            background: "neutral200",
                            height: "3.2rem",
                            width: "3.2rem",
                            children: /*#__PURE__*/ jsx(CaretDown, {})
                        }),
                        /*#__PURE__*/ jsx(Flex, {
                            maxWidth: "15rem",
                            children: /*#__PURE__*/ jsx(Typography, {
                                textColor: "neutral700",
                                ellipsis: true,
                                children: displayedValue
                            })
                        })
                    ]
                })
            }),
            /*#__PURE__*/ jsxs(Flex, {
                gap: 2,
                children: [
                    /*#__PURE__*/ jsx(IconButton, {
                        withTooltip: false,
                        label: "",
                        variant: "ghost",
                        children: /*#__PURE__*/ jsx(Trash, {})
                    }),
                    isDesktop && /*#__PURE__*/ jsx(IconButton, {
                        withTooltip: false,
                        label: "",
                        variant: "ghost",
                        children: /*#__PURE__*/ jsx(Drag, {})
                    })
                ]
            })
        ]
    });
};
const DropdownIconWrapper = styled(Flex)`
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
const ToggleButton = styled.button`
  border: none;
  background: transparent;
  display: block;
  width: 100%;
  text-align: unset;
  padding: 0;
`;

export { ComponentDragPreview };
//# sourceMappingURL=ComponentDragPreview.mjs.map
