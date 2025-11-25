import { jsx, jsxs } from 'react/jsx-runtime';
import { memo, forwardRef } from 'react';
import { useComposedRefs, Field, TextInput } from '@strapi/design-system';
import { useFocusInputField } from '../../hooks/useFocusInputField.mjs';
import { useField } from '../Form.mjs';
import { BooleanInput as MemoizedBooleanInput } from './Boolean.mjs';
import { CheckboxInput as MemoizedCheckboxInput } from './Checkbox.mjs';
import { DateInput as MemoizedDateInput } from './Date.mjs';
import { DateTimeInput as MemoizedDateTimeInput } from './DateTime.mjs';
import { EmailInput as MemoizedEmailInput } from './Email.mjs';
import { EnumerationInput as MemoizedEnumerationInput } from './Enumeration.mjs';
import { JsonInput as MemoizedJsonInput } from './Json.mjs';
import { NumberInput as MemoizedNumberInput } from './Number.mjs';
import { PasswordInput as MemoizedPasswordInput } from './Password.mjs';
import { StringInput as MemoizedStringInput } from './String.mjs';
import { TextareaInput as MemoizedTextareaInput } from './Textarea.mjs';
import { TimeInput as MemoizedTimeInput } from './Time.mjs';

/* -------------------------------------------------------------------------------------------------
 * InputRenderer
 * -----------------------------------------------------------------------------------------------*/ /**
 * @internal This needs to be tested before being exposed as a public API.
 * @experimental
 * @description A generic form renderer for Strapi forms. Similar to GenericInputs but with a different API.
 * The entire component is memoized to avoid re-renders in large forms.
 */ const InputRenderer = /*#__PURE__*/ memo(/*#__PURE__*/ forwardRef((props, forwardRef)=>{
    switch(props.type){
        case 'biginteger':
        case 'timestamp':
        case 'string':
        case 'uid':
            return /*#__PURE__*/ jsx(MemoizedStringInput, {
                ref: forwardRef,
                ...props
            });
        case 'boolean':
            return /*#__PURE__*/ jsx(MemoizedBooleanInput, {
                ref: forwardRef,
                ...props
            });
        case 'checkbox':
            return /*#__PURE__*/ jsx(MemoizedCheckboxInput, {
                ref: forwardRef,
                ...props
            });
        case 'datetime':
            return /*#__PURE__*/ jsx(MemoizedDateTimeInput, {
                ref: forwardRef,
                ...props
            });
        case 'date':
            return /*#__PURE__*/ jsx(MemoizedDateInput, {
                ref: forwardRef,
                ...props
            });
        case 'decimal':
        case 'float':
        case 'integer':
            return /*#__PURE__*/ jsx(MemoizedNumberInput, {
                ref: forwardRef,
                ...props
            });
        case 'json':
            return /*#__PURE__*/ jsx(MemoizedJsonInput, {
                ref: forwardRef,
                ...props
            });
        case 'email':
            return /*#__PURE__*/ jsx(MemoizedEmailInput, {
                ref: forwardRef,
                ...props
            });
        case 'enumeration':
            return /*#__PURE__*/ jsx(MemoizedEnumerationInput, {
                ref: forwardRef,
                ...props
            });
        case 'password':
            return /*#__PURE__*/ jsx(MemoizedPasswordInput, {
                ref: forwardRef,
                ...props
            });
        case 'text':
            return /*#__PURE__*/ jsx(MemoizedTextareaInput, {
                ref: forwardRef,
                ...props
            });
        case 'time':
            return /*#__PURE__*/ jsx(MemoizedTimeInput, {
                ref: forwardRef,
                ...props
            });
        default:
            // This is cast because this renderer tackles all the possibilities of the InputProps, but this is for runtime catches.
            return /*#__PURE__*/ jsx(NotSupportedField, {
                ref: forwardRef,
                ...props
            });
    }
}));
const NotSupportedField = /*#__PURE__*/ forwardRef(({ label, hint, name, required, type, labelAction }, ref)=>{
    const { error } = useField(name);
    const fieldRef = useFocusInputField(name);
    const composedRefs = useComposedRefs(ref, fieldRef);
    return /*#__PURE__*/ jsxs(Field.Root, {
        error: error,
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
                disabled: true,
                placeholder: `Unsupported field type: ${type}`,
                required: required,
                type: "text",
                value: ""
            }),
            /*#__PURE__*/ jsx(Field.Hint, {}),
            /*#__PURE__*/ jsx(Field.Error, {})
        ]
    });
});
const MemoizedInputRenderer = /*#__PURE__*/ memo(InputRenderer);

export { MemoizedInputRenderer as InputRenderer };
//# sourceMappingURL=Renderer.mjs.map
