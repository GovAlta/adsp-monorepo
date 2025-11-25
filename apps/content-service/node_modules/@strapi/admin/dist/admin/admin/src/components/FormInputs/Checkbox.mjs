import { jsxs, jsx } from 'react/jsx-runtime';
import { memo, forwardRef } from 'react';
import { useComposedRefs, Field, Checkbox } from '@strapi/design-system';
import { useFocusInputField } from '../../hooks/useFocusInputField.mjs';
import { useField } from '../Form.mjs';

const CheckboxInput = /*#__PURE__*/ forwardRef(({ name, required, label, hint, type: _type, ...props }, ref)=>{
    const field = useField(name);
    const fieldRef = useFocusInputField(name);
    const composedRefs = useComposedRefs(ref, fieldRef);
    return /*#__PURE__*/ jsxs(Field.Root, {
        error: field.error,
        name: name,
        hint: hint,
        required: required,
        children: [
            /*#__PURE__*/ jsx(Checkbox, {
                onCheckedChange: (checked)=>field.onChange(name, !!checked),
                ref: composedRefs,
                checked: field.value,
                ...props,
                children: label || props['aria-label']
            }),
            /*#__PURE__*/ jsx(Field.Hint, {}),
            /*#__PURE__*/ jsx(Field.Error, {})
        ]
    });
});
const MemoizedCheckboxInput = /*#__PURE__*/ memo(CheckboxInput);

export { MemoizedCheckboxInput as CheckboxInput };
//# sourceMappingURL=Checkbox.mjs.map
