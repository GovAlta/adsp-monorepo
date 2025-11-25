import { jsx, jsxs } from 'react/jsx-runtime';
import { useIsDesktop } from '@strapi/admin/strapi-admin';
import { Box, Flex, IconButton, Typography } from '@strapi/design-system';
import { Drag, Cross } from '@strapi/icons';
import { DocumentStatus } from '../../pages/EditView/components/DocumentStatus.mjs';
import { FlexWrapper, LinkEllipsis, DisconnectButton } from '../../pages/EditView/components/FormInputs/Relations/Relations.mjs';

const RelationDragPreview = ({ status, displayedValue, width })=>{
    const isDesktop = useIsDesktop();
    return /*#__PURE__*/ jsx(Box, {
        style: {
            width
        },
        children: /*#__PURE__*/ jsxs(Flex, {
            paddingTop: 2,
            paddingBottom: 2,
            paddingLeft: 2,
            paddingRight: 4,
            hasRadius: true,
            borderWidth: 1,
            background: "neutral0",
            borderColor: "neutral200",
            justifyContent: "space-between",
            gap: 4,
            children: [
                /*#__PURE__*/ jsxs(FlexWrapper, {
                    gap: 1,
                    children: [
                        isDesktop && /*#__PURE__*/ jsx(IconButton, {
                            withTooltip: false,
                            label: "",
                            variant: "ghost",
                            children: /*#__PURE__*/ jsx(Drag, {})
                        }),
                        /*#__PURE__*/ jsxs(Flex, {
                            width: "100%",
                            minWidth: 0,
                            justifyContent: "space-between",
                            children: [
                                /*#__PURE__*/ jsx(Box, {
                                    minWidth: 0,
                                    paddingTop: 1,
                                    paddingBottom: 1,
                                    paddingRight: 4,
                                    children: /*#__PURE__*/ jsx(LinkEllipsis, {
                                        href: "",
                                        children: /*#__PURE__*/ jsx(Typography, {
                                            textColor: "primary600",
                                            ellipsis: true,
                                            children: displayedValue
                                        })
                                    })
                                }),
                                status ? /*#__PURE__*/ jsx(DocumentStatus, {
                                    status: status
                                }) : null
                            ]
                        })
                    ]
                }),
                /*#__PURE__*/ jsx(DisconnectButton, {
                    type: "button",
                    children: /*#__PURE__*/ jsx(Cross, {
                        width: "12px"
                    })
                })
            ]
        })
    });
};

export { RelationDragPreview };
//# sourceMappingURL=RelationDragPreview.mjs.map
