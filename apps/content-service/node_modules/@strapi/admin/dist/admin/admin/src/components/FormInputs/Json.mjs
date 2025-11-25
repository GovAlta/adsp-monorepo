import { jsxs, jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { useComposedRefs, Field, JSONInput } from '@strapi/design-system';
import { useFocusInputField } from '../../hooks/useFocusInputField.mjs';
import { useField } from '../Form.mjs';

const JsonInput = /*#__PURE__*/ React.forwardRef(({ name, required, label, hint, labelAction, ...props }, ref)=>{
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
            /*#__PURE__*/ jsx(JSONInput, {
                ref: composedRefs,
                value: typeof field.value == 'object' ? JSON.stringify(field.value, null, 2) : field.value,
                onChange: (json)=>{
                    // Default to null when the field is not required and there is no input value
                    const value = required && !json.length ? null : json;
                    field.onChange(name, value);
                },
                minHeight: `25.2rem`,
                maxHeight: `50.4rem`,
                ...props
            }),
            /*#__PURE__*/ jsx(Field.Hint, {}),
            /*#__PURE__*/ jsx(Field.Error, {})
        ]
    });
});
const MemoizedJsonInput = /*#__PURE__*/ React.memo(JsonInput);

export { MemoizedJsonInput as JsonInput };
//# sourceMappingURL=Json.mjs.map
