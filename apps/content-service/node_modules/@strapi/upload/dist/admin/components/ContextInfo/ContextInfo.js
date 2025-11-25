'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');

const ContextInfo = ({ blocks })=>{
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
        hasRadius: true,
        paddingLeft: 6,
        paddingRight: 6,
        paddingTop: 4,
        paddingBottom: 4,
        background: "neutral100",
        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Root, {
            gap: 4,
            children: blocks.map(({ label, value })=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                    col: 6,
                    xs: 12,
                    direction: "column",
                    alignItems: "stretch",
                    children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                        direction: "column",
                        alignItems: "stretch",
                        gap: 1,
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                variant: "sigma",
                                textColor: "neutral600",
                                children: label
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                variant: "pi",
                                textColor: "neutral700",
                                children: value
                            })
                        ]
                    })
                }, label))
        })
    });
};

exports.ContextInfo = ContextInfo;
//# sourceMappingURL=ContextInfo.js.map
