'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var useFocusInputField = require('../../hooks/useFocusInputField.js');
var Form = require('../Form.js');

const PasswordInput = /*#__PURE__*/ React.forwardRef(({ name, required, label, hint, labelAction, ...props }, ref)=>{
    const [showPassword, setShowPassword] = React.useState(false);
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
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.TextInput, {
                ref: composedRefs,
                autoComplete: "password",
                endAction: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Action, {
                    label: formatMessage({
                        id: 'Auth.form.password.show-password',
                        defaultMessage: 'Show password'
                    }),
                    onClick: ()=>{
                        setShowPassword((prev)=>!prev);
                    },
                    children: showPassword ? /*#__PURE__*/ jsxRuntime.jsx(icons.Eye, {
                        fill: "neutral500"
                    }) : /*#__PURE__*/ jsxRuntime.jsx(icons.EyeStriked, {
                        fill: "neutral500"
                    })
                }),
                onChange: field.onChange,
                value: field.value,
                ...props,
                type: showPassword ? 'text' : 'password'
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Hint, {}),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Error, {})
        ]
    });
});
const MemoizedPasswordInput = /*#__PURE__*/ React.memo(PasswordInput);

exports.PasswordInput = MemoizedPasswordInput;
//# sourceMappingURL=Password.js.map
