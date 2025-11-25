import { jsxs, jsx } from 'react/jsx-runtime';
import { memo, forwardRef } from 'react';
import { useComposedRefs, Field, NumberInput } from '@strapi/design-system';
import { useFocusInputField } from '../../hooks/useFocusInputField.mjs';
import { useField } from '../Form.mjs';

const NumberInputImpl = /*#__PURE__*/ forwardRef(({ name, required, label, hint, labelAction, type, ...props }, ref)=>{
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
            /*#__PURE__*/ jsx(NumberInput, {
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
            /*#__PURE__*/ jsx(Field.Hint, {}),
            /*#__PURE__*/ jsx(Field.Error, {})
        ]
    });
});
const MemoizedNumberInput = /*#__PURE__*/ memo(NumberInputImpl);

export { MemoizedNumberInput as NumberInput };
//# sourceMappingURL=Number.mjs.map
