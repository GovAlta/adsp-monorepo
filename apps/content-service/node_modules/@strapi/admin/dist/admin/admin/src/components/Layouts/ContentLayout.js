'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var designSystem = require('@strapi/design-system');
var theme = require('../../constants/theme.js');

const ContentLayout = ({ children })=>{
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
        paddingLeft: theme.RESPONSIVE_DEFAULT_SPACING,
        paddingRight: theme.RESPONSIVE_DEFAULT_SPACING,
        children: children
    });
};

exports.ContentLayout = ContentLayout;
//# sourceMappingURL=ContentLayout.js.map
