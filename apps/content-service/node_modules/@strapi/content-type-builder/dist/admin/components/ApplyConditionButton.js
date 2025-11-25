'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');

const ApplyConditionButton = ({ disabled, tooltipMessage, onClick, marginTop = 4 })=>{
    const { formatMessage } = reactIntl.useIntl();
    const button = /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
        marginTop: marginTop,
        fullWidth: true,
        variant: "secondary",
        disabled: disabled,
        onClick: onClick,
        startIcon: /*#__PURE__*/ jsxRuntime.jsx("span", {
            "aria-hidden": true,
            children: "＋"
        }),
        children: formatMessage({
            id: 'form.attribute.condition.apply',
            defaultMessage: 'Apply condition'
        })
    });
    if (tooltipMessage) {
        return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tooltip, {
            description: tooltipMessage,
            children: button
        });
    }
    return button;
};

exports.ApplyConditionButton = ApplyConditionButton;
//# sourceMappingURL=ApplyConditionButton.js.map
