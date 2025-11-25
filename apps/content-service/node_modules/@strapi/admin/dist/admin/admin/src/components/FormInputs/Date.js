'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var useFocusInputField = require('../../hooks/useFocusInputField.js');
var Form = require('../Form.js');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var React__namespace = /*#__PURE__*/_interopNamespaceDefault(React);

const DateInput = /*#__PURE__*/ React__namespace.forwardRef(({ name, required, label, hint, labelAction, type: _type, ...props }, ref)=>{
    const { formatMessage } = reactIntl.useIntl();
    const field = Form.useField(name);
    const fieldRef = useFocusInputField.useFocusInputField(name);
    const composedRefs = designSystem.useComposedRefs(ref, fieldRef);
    const [lastValidDate, setLastValidDate] = React__namespace.useState(null);
    const value = typeof field.value === 'string' ? new Date(field.value) : field.value;
    const handleDateChange = (date)=>{
        if (!date) {
            field.onChange(name, null);
            setLastValidDate(null);
            return;
        }
        // Convert to UTC midnight
        const utcDate = toUTCMidnight(date);
        // Save as ISO string in UTC format
        field.onChange(name, utcDate.toISOString());
        setLastValidDate(utcDate);
    };
    // Render the DatePicker with UTC date
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
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.DatePicker, {
                ref: composedRefs,
                clearLabel: formatMessage({
                    id: 'clearLabel',
                    defaultMessage: 'Clear'
                }),
                onChange: handleDateChange,
                onClear: ()=>{
                    field.onChange(name, null);
                    setLastValidDate(null);
                    return;
                },
                onBlur: ()=>{
                    // When the input is blurred, revert to the last valid date if the current value is invalid
                    if (field.value && !value) {
                        field.onChange(name, lastValidDate?.toISOString() ?? null);
                    }
                },
                value: value,
                ...props
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Hint, {}),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Error, {})
        ]
    });
});
// Ensure the conversion to UTC midnight
const toUTCMidnight = (date)=>{
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
};
const MemoizedDateInput = /*#__PURE__*/ React__namespace.memo(DateInput);

exports.DateInput = MemoizedDateInput;
//# sourceMappingURL=Date.js.map
