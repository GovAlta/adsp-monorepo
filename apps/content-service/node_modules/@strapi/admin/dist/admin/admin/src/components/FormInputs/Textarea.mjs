import { jsxs, jsx } from 'react/jsx-runtime';
import { memo, forwardRef } from 'react';
import { useComposedRefs, Field, Textarea } from '@strapi/design-system';
import { useFocusInputField } from '../../hooks/useFocusInputField.mjs';
import { useField } from '../Form.mjs';

const TextareaInput = /*#__PURE__*/ forwardRef(({ name, required, label, hint, labelAction, ...props }, ref)=>{
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
            /*#__PURE__*/ jsx(Textarea, {
                ref: composedRefs,
                onChange: field.onChange,
                value: field.value ?? '',
                ...props
            }),
            /*#__PURE__*/ jsx(Field.Hint, {}),
            /*#__PURE__*/ jsx(Field.Error, {})
        ]
    });
});
const MemoizedTextareaInput = /*#__PURE__*/ memo(TextareaInput);

export { MemoizedTextareaInput as TextareaInput };
//# sourceMappingURL=Textarea.mjs.map
