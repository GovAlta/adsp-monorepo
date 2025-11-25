'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var designSystem = require('@strapi/design-system');

const FolderGridList = ({ title = null, children })=>{
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.KeyboardNavigable, {
        tagName: "article",
        children: [
            title && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                paddingBottom: 2,
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                    tag: "h2",
                    variant: "delta",
                    fontWeight: "semiBold",
                    children: title
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Root, {
                gap: 4,
                children: children
            })
        ]
    });
};

exports.FolderGridList = FolderGridList;
//# sourceMappingURL=FolderGridList.js.map
