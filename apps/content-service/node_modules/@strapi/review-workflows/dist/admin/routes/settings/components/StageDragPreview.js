'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');

const StageDragPreview = ({ name })=>{
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
        background: "primary100",
        borderStyle: "dashed",
        borderColor: "primary600",
        borderWidth: "1px",
        gap: 3,
        hasRadius: true,
        padding: 3,
        shadow: "tableShadow",
        width: "30rem",
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                alignItems: "center",
                background: "neutral200",
                borderRadius: "50%",
                height: 6,
                justifyContent: "center",
                width: 6,
                children: /*#__PURE__*/ jsxRuntime.jsx(icons.CaretDown, {
                    width: "0.8rem",
                    fill: "neutral600"
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                fontWeight: "bold",
                children: name
            })
        ]
    });
};

exports.StageDragPreview = StageDragPreview;
//# sourceMappingURL=StageDragPreview.js.map
