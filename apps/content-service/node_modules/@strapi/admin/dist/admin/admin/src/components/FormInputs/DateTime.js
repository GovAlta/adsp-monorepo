'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var useFocusInputField = require('../../hooks/useFocusInputField.js');
var Form = require('../Form.js');

const DateTimeInput = /*#__PURE__*/ React.forwardRef(({ name, required, label, hint, labelAction, ...props }, ref)=>{
    const { formatMessage } = reactIntl.useIntl();
    const field = Form.useField(name);
    const fieldRef = useFocusInputField.useFocusInputField(name);
    const composedRefs = designSystem.useComposedRefs(ref, fieldRef);
    const value = typeof field.value === 'string' ? new Date(field.value) : field.value;
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
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.DateTimePicker, {
                ref: composedRefs,
                clearLabel: formatMessage({
                    id: 'clearLabel',
                    defaultMessage: 'Clear'
                }),
                onChange: (date)=>{
                    // Store ISO string in the field, but Date object in the component value
                    field.onChange(name, date ? date.toISOString() : null);
                },
                onClear: ()=>field.onChange(name, null),
                value: value,
                ...props
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Hint, {}),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Error, {})
        ]
    });
});
const MemoizedDateTimeInput = /*#__PURE__*/ React.memo(DateTimeInput);

exports.DateTimeInput = MemoizedDateTimeInput;
//# sourceMappingURL=DateTime.js.map
