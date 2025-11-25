'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var designSystem = require('@strapi/design-system');
var theme = require('../../constants/theme.js');

const ActionLayout = ({ startActions, endActions })=>{
    if (!startActions && !endActions) {
        return null;
    }
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
        justifyContent: "space-between",
        alignItems: "flex-start",
        paddingBottom: 4,
        paddingLeft: theme.RESPONSIVE_DEFAULT_SPACING,
        paddingRight: theme.RESPONSIVE_DEFAULT_SPACING,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                gap: 2,
                wrap: "wrap",
                children: startActions
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                gap: 2,
                shrink: 0,
                wrap: "wrap",
                children: endActions
            })
        ]
    });
};

exports.ActionLayout = ActionLayout;
//# sourceMappingURL=ActionLayout.js.map
