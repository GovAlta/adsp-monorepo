'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var symbols = require('@strapi/icons/symbols');
var EmptyAssetGrid = require('./EmptyAssetGrid.js');

// TODO: find a better naming convention for the file that was an index file before
const EmptyAssets = ({ icon: Icon = symbols.EmptyDocuments, content, action, size = 'M', count = 12 })=>{
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Box, {
        position: "relative",
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(EmptyAssetGrid.EmptyAssetGrid, {
                size: size,
                count: count
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                position: "absolute",
                top: 11,
                width: "100%",
                children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                    direction: "column",
                    alignItems: "center",
                    gap: 4,
                    textAlign: "center",
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                            direction: "column",
                            alignItems: "center",
                            gap: 6,
                            children: [
                                /*#__PURE__*/ jsxRuntime.jsx(Icon, {
                                    width: "160px",
                                    height: "88px"
                                }),
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                    variant: "delta",
                                    tag: "p",
                                    textColor: "neutral600",
                                    children: content
                                })
                            ]
                        }),
                        action
                    ]
                })
            })
        ]
    });
};

exports.EmptyAssets = EmptyAssets;
//# sourceMappingURL=EmptyAssets.js.map
