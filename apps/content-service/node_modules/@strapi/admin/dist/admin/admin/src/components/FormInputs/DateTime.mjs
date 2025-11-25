import { jsxs, jsx } from 'react/jsx-runtime';
import { memo, forwardRef } from 'react';
import { useComposedRefs, Field, DateTimePicker } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { useFocusInputField } from '../../hooks/useFocusInputField.mjs';
import { useField } from '../Form.mjs';

const DateTimeInput = /*#__PURE__*/ forwardRef(({ name, required, label, hint, labelAction, ...props }, ref)=>{
    const { formatMessage } = useIntl();
    const field = useField(name);
    const fieldRef = useFocusInputField(name);
    const composedRefs = useComposedRefs(ref, fieldRef);
    const value = typeof field.value === 'string' ? new Date(field.value) : field.value;
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
            /*#__PURE__*/ jsx(DateTimePicker, {
                ref: composedRefs,
                clearLabel: formatMessage({
                    id: 'clearLabel',
                    defaultMessage: 'Clear'
                }),
                onChange: (date)=>{
                    // Store ISO string in the field, but Date object in the component value
                    field.onChange(name, date ? date.toISOString() : null);
                },
                onClear: ()=>field.onChange(name, null),
                value: value,
                ...props
            }),
            /*#__PURE__*/ jsx(Field.Hint, {}),
            /*#__PURE__*/ jsx(Field.Error, {})
        ]
    });
});
const MemoizedDateTimeInput = /*#__PURE__*/ memo(DateTimeInput);

export { MemoizedDateTimeInput as DateTimeInput };
//# sourceMappingURL=DateTime.mjs.map
