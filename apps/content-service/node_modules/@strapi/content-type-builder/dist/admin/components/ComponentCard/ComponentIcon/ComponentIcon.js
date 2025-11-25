'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var constants = require('../../IconPicker/constants.js');

const ComponentIcon = ({ isActive = false, icon = 'dashboard' })=>{
    const Icon = constants.COMPONENT_ICONS[icon] || constants.COMPONENT_ICONS.dashboard;
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
        alignItems: "center",
        background: isActive ? 'primary200' : 'neutral200',
        justifyContent: "center",
        height: 8,
        width: 8,
        borderRadius: "50%",
        children: /*#__PURE__*/ jsxRuntime.jsx(Icon, {
            height: "2rem",
            width: "2rem"
        })
    });
};

exports.ComponentIcon = ComponentIcon;
//# sourceMappingURL=ComponentIcon.js.map
