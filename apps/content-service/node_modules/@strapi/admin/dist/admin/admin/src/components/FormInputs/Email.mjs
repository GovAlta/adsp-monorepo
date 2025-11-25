import { jsxs, jsx } from 'react/jsx-runtime';
import { memo, forwardRef } from 'react';
import { useComposedRefs, Field, TextInput } from '@strapi/design-system';
import { useFocusInputField } from '../../hooks/useFocusInputField.mjs';
import { useField } from '../Form.mjs';

const EmailInput = /*#__PURE__*/ forwardRef(({ name, required, label, hint, labelAction, ...props }, ref)=>{
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
                autoComplete: "email",
                onChange: field.onChange,
                value: field.value,
                ...props,
                type: "email"
            }),
            /*#__PURE__*/ jsx(Field.Hint, {}),
            /*#__PURE__*/ jsx(Field.Error, {})
        ]
    });
});
const MemoizedEmailInput = /*#__PURE__*/ memo(EmailInput);

export { MemoizedEmailInput as EmailInput };
//# sourceMappingURL=Email.mjs.map
