'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var reactIntl = require('react-intl');

const NotAllowedInput = ({ hint, label, required, name })=>{
    const { formatMessage } = reactIntl.useIntl();
    const placeholder = formatMessage({
        id: 'components.NotAllowedInput.text',
        defaultMessage: 'No permissions to see this field'
    });
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
        id: name,
        hint: hint,
        name: name,
        required: required,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                children: label
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.TextInput, {
                disabled: true,
                placeholder: placeholder,
                startAction: /*#__PURE__*/ jsxRuntime.jsx(Icons.EyeStriked, {
                    fill: "neutral600"
                }),
                type: "text",
                value: ""
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Hint, {})
        ]
    });
};

exports.NotAllowedInput = NotAllowedInput;
//# sourceMappingURL=NotAllowed.js.map
