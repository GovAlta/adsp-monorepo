'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var useFocusInputField = require('../../hooks/useFocusInputField.js');
var Form = require('../Form.js');

const NumberInputImpl = /*#__PURE__*/ React.forwardRef(({ name, required, label, hint, labelAction, type, ...props }, ref)=>{
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
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.NumberInput, {
                ref: composedRefs,
                onValueChange: (value)=>{
                    // Convert undefined to null to store it in the form state
                    // See https://github.com/strapi/strapi/issues/22533
                    field.onChange(name, value ?? null);
                },
                step: type === 'float' || type == 'decimal' ? 0.01 : 1,
                value: field.value ?? undefined,
                ...props
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Hint, {}),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Error, {})
        ]
    });
});
const MemoizedNumberInput = /*#__PURE__*/ React.memo(NumberInputImpl);

exports.NumberInput = MemoizedNumberInput;
//# sourceMappingURL=Number.js.map
