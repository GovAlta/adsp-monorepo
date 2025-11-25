'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var useFocusInputField = require('../../hooks/useFocusInputField.js');
var Form = require('../Form.js');

const EnumerationInput = /*#__PURE__*/ React.forwardRef(({ name, required, label, hint, labelAction, options = [], ...props }, ref)=>{
    const { formatMessage } = reactIntl.useIntl();
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
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.SingleSelect, {
                ref: composedRefs,
                onChange: (value)=>{
                    field.onChange(name, value);
                },
                value: field.value,
                ...props,
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelectOption, {
                        value: "",
                        disabled: required,
                        hidden: required,
                        children: formatMessage({
                            id: 'components.InputSelect.option.placeholder',
                            defaultMessage: 'Choose here'
                        })
                    }),
                    options.map(({ value, label, disabled, hidden })=>{
                        return /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelectOption, {
                            value: value,
                            disabled: disabled,
                            hidden: hidden,
                            children: label ?? value
                        }, value);
                    })
                ]
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Hint, {}),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Error, {})
        ]
    });
});
const MemoizedEnumerationInput = /*#__PURE__*/ React.memo(EnumerationInput);

exports.EnumerationInput = MemoizedEnumerationInput;
//# sourceMappingURL=Enumeration.js.map
