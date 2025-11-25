'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var designSystem = require('@strapi/design-system');

const DynamicZoneLabel = ({ hint, label, labelAction, name, numberOfComponents = 0, required })=>{
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
        justifyContent: "center",
        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
            paddingTop: 3,
            paddingBottom: 3,
            paddingRight: 4,
            paddingLeft: 4,
            borderRadius: "26px",
            background: "neutral0",
            shadow: "filterShadow",
            color: "neutral500",
            children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                direction: "column",
                justifyContent: "center",
                children: [
                    /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                        maxWidth: "35.6rem",
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Typography, {
                                variant: "pi",
                                textColor: "neutral600",
                                fontWeight: "bold",
                                ellipsis: true,
                                children: [
                                    label || name,
                                    " "
                                ]
                            }),
                            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Typography, {
                                variant: "pi",
                                textColor: "neutral600",
                                fontWeight: "bold",
                                children: [
                                    "(",
                                    numberOfComponents,
                                    ")"
                                ]
                            }),
                            required && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                textColor: "danger600",
                                children: "*"
                            }),
                            labelAction && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                paddingLeft: 1,
                                children: labelAction
                            })
                        ]
                    }),
                    hint && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                        paddingTop: 1,
                        maxWidth: "35.6rem",
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                            variant: "pi",
                            textColor: "neutral600",
                            ellipsis: true,
                            children: hint
                        })
                    })
                ]
            })
        })
    });
};

exports.DynamicZoneLabel = DynamicZoneLabel;
//# sourceMappingURL=DynamicZoneLabel.js.map
