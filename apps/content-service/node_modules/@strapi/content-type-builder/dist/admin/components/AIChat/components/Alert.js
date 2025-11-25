'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');

const COLORS = {
    danger: {
        background: 'danger100',
        borderColor: 'danger200',
        textColor: 'danger700'
    },
    warning: {
        background: 'warning100',
        borderColor: 'warning200',
        textColor: 'warning600'
    }
};
const Alert = ({ title, variant = 'danger' })=>{
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
        padding: 3,
        background: COLORS[variant].background,
        borderColor: COLORS[variant].borderColor,
        hasRadius: true,
        width: "100%",
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
            gap: 2,
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(Icons.WarningCircle, {
                    style: {
                        minWidth: '16px'
                    },
                    fill: COLORS[variant].textColor
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                    variant: "omega",
                    textColor: COLORS[variant].textColor,
                    children: title
                })
            ]
        })
    });
};

exports.Alert = Alert;
//# sourceMappingURL=Alert.js.map
