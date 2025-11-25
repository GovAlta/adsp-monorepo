'use strict';

var jsxRuntime = require('react/jsx-runtime');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var DocumentStatus = require('../../pages/EditView/components/DocumentStatus.js');
var Relations = require('../../pages/EditView/components/FormInputs/Relations/Relations.js');

const RelationDragPreview = ({ status, displayedValue, width })=>{
    const isDesktop = strapiAdmin.useIsDesktop();
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
        style: {
            width
        },
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
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
                /*#__PURE__*/ jsxRuntime.jsxs(Relations.FlexWrapper, {
                    gap: 1,
                    children: [
                        isDesktop && /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                            withTooltip: false,
                            label: "",
                            variant: "ghost",
                            children: /*#__PURE__*/ jsxRuntime.jsx(Icons.Drag, {})
                        }),
                        /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                            width: "100%",
                            minWidth: 0,
                            justifyContent: "space-between",
                            children: [
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                    minWidth: 0,
                                    paddingTop: 1,
                                    paddingBottom: 1,
                                    paddingRight: 4,
                                    children: /*#__PURE__*/ jsxRuntime.jsx(Relations.LinkEllipsis, {
                                        href: "",
                                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                            textColor: "primary600",
                                            ellipsis: true,
                                            children: displayedValue
                                        })
                                    })
                                }),
                                status ? /*#__PURE__*/ jsxRuntime.jsx(DocumentStatus.DocumentStatus, {
                                    status: status
                                }) : null
                            ]
                        })
                    ]
                }),
                /*#__PURE__*/ jsxRuntime.jsx(Relations.DisconnectButton, {
                    type: "button",
                    children: /*#__PURE__*/ jsxRuntime.jsx(Icons.Cross, {
                        width: "12px"
                    })
                })
            ]
        })
    });
};

exports.RelationDragPreview = RelationDragPreview;
//# sourceMappingURL=RelationDragPreview.js.map
