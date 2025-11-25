'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var useFocusInputField = require('../../hooks/useFocusInputField.js');
var Form = require('../Form.js');

const EmailInput = /*#__PURE__*/ React.forwardRef(({ name, required, label, hint, labelAction, ...props }, ref)=>{
    const field = Form.useField(name);
    const fieldRef = useFocusInputField.useFocusInputField(name);
    const composedRefs = designSystem.useComposedRefs(ref, fieldRef);
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
        error: field.error,
        name: name,
        hint: hint,
        required: required,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                action: labelAction,
                children: label
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.TextInput, {
                ref: composedRefs,
                autoComplete: "email",
                onChange: field.onChange,
                value: field.value,
                ...props,
                type: "email"
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Hint, {}),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Error, {})
        ]
    });
});
const MemoizedEmailInput = /*#__PURE__*/ React.memo(EmailInput);

exports.EmailInput = MemoizedEmailInput;
//# sourceMappingURL=Email.js.map
