'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var useFocusInputField = require('../../hooks/useFocusInputField.js');
var Form = require('../Form.js');

const CheckboxInput = /*#__PURE__*/ React.forwardRef(({ name, required, label, hint, type: _type, ...props }, ref)=>{
    const field = Form.useField(name);
    const fieldRef = useFocusInputField.useFocusInputField(name);
    const composedRefs = designSystem.useComposedRefs(ref, fieldRef);
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
        error: field.error,
        name: name,
        hint: hint,
        required: required,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Checkbox, {
                onCheckedChange: (checked)=>field.onChange(name, !!checked),
                ref: composedRefs,
                checked: field.value,
                ...props,
                children: label || props['aria-label']
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Hint, {}),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Error, {})
        ]
    });
});
const MemoizedCheckboxInput = /*#__PURE__*/ React.memo(CheckboxInput);

exports.CheckboxInput = MemoizedCheckboxInput;
//# sourceMappingURL=Checkbox.js.map
