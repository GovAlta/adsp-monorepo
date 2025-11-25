'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var useFocusInputField = require('../../hooks/useFocusInputField.js');
var Form = require('../Form.js');

const BooleanInput = /*#__PURE__*/ React.forwardRef(({ name, required, label, hint, labelAction, ...props }, ref)=>{
    const { formatMessage } = reactIntl.useIntl();
    const field = Form.useField(name);
    const fieldRef = useFocusInputField.useFocusInputField(name);
    const composedRefs = designSystem.useComposedRefs(ref, fieldRef);
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
        error: field.error,
        name: name,
        hint: hint,
        required: required,
        maxWidth: "320px",
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                action: labelAction,
                children: label
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Toggle, {
                ref: composedRefs,
                checked: field.value === null ? null : field.value || false,
                offLabel: formatMessage({
                    id: 'app.components.ToggleCheckbox.off-label',
                    defaultMessage: 'False'
                }),
                onLabel: formatMessage({
                    id: 'app.components.ToggleCheckbox.on-label',
                    defaultMessage: 'True'
                }),
                onChange: field.onChange,
                ...props
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Hint, {}),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Error, {})
        ]
    });
});
const MemoizedBooleanInput = /*#__PURE__*/ React.memo(BooleanInput);

exports.BooleanInput = MemoizedBooleanInput;
//# sourceMappingURL=Boolean.js.map
