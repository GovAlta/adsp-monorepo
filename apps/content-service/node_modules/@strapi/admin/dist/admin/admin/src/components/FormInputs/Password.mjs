import { jsxs, jsx } from 'react/jsx-runtime';
import { memo, forwardRef, useState } from 'react';
import { useComposedRefs, Field, TextInput } from '@strapi/design-system';
import { Eye, EyeStriked } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { useFocusInputField } from '../../hooks/useFocusInputField.mjs';
import { useField } from '../Form.mjs';

const PasswordInput = /*#__PURE__*/ forwardRef(({ name, required, label, hint, labelAction, ...props }, ref)=>{
    const [showPassword, setShowPassword] = useState(false);
    const { formatMessage } = useIntl();
    const field = useField(name);
    const fieldRef = useFocusInputField(name);
    const composedRefs = useComposedRefs(ref, fieldRef);
    return /*#__PURE__*/ jsxs(Field.Root, {
        error: field.error,
        name: name,
        hint: hint,
        required: required,
        children: [
            /*#__PURE__*/ jsx(Field.Label, {
                action: labelAction,
                children: label
            }),
            /*#__PURE__*/ jsx(TextInput, {
                ref: composedRefs,
                autoComplete: "password",
                endAction: /*#__PURE__*/ jsx(Field.Action, {
                    label: formatMessage({
                        id: 'Auth.form.password.show-password',
                        defaultMessage: 'Show password'
                    }),
                    onClick: ()=>{
                        setShowPassword((prev)=>!prev);
                    },
                    children: showPassword ? /*#__PURE__*/ jsx(Eye, {
                        fill: "neutral500"
                    }) : /*#__PURE__*/ jsx(EyeStriked, {
                        fill: "neutral500"
                    })
                }),
                onChange: field.onChange,
                value: field.value,
                ...props,
                type: showPassword ? 'text' : 'password'
            }),
            /*#__PURE__*/ jsx(Field.Hint, {}),
            /*#__PURE__*/ jsx(Field.Error, {})
        ]
    });
});
const MemoizedPasswordInput = /*#__PURE__*/ memo(PasswordInput);

export { MemoizedPasswordInput as PasswordInput };
//# sourceMappingURL=Password.mjs.map
