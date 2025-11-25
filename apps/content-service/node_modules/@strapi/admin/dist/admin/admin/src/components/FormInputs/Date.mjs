import { jsxs, jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { useComposedRefs, Field, DatePicker } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { useFocusInputField } from '../../hooks/useFocusInputField.mjs';
import { useField } from '../Form.mjs';

const DateInput = /*#__PURE__*/ React.forwardRef(({ name, required, label, hint, labelAction, type: _type, ...props }, ref)=>{
    const { formatMessage } = useIntl();
    const field = useField(name);
    const fieldRef = useFocusInputField(name);
    const composedRefs = useComposedRefs(ref, fieldRef);
    const [lastValidDate, setLastValidDate] = React.useState(null);
    const value = typeof field.value === 'string' ? new Date(field.value) : field.value;
    const handleDateChange = (date)=>{
        if (!date) {
            field.onChange(name, null);
            setLastValidDate(null);
            return;
        }
        // Convert to UTC midnight
        const utcDate = toUTCMidnight(date);
        // Save as ISO string in UTC format
        field.onChange(name, utcDate.toISOString());
        setLastValidDate(utcDate);
    };
    // Render the DatePicker with UTC date
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
            /*#__PURE__*/ jsx(DatePicker, {
                ref: composedRefs,
                clearLabel: formatMessage({
                    id: 'clearLabel',
                    defaultMessage: 'Clear'
                }),
                onChange: handleDateChange,
                onClear: ()=>{
                    field.onChange(name, null);
                    setLastValidDate(null);
                    return;
                },
                onBlur: ()=>{
                    // When the input is blurred, revert to the last valid date if the current value is invalid
                    if (field.value && !value) {
                        field.onChange(name, lastValidDate?.toISOString() ?? null);
                    }
                },
                value: value,
                ...props
            }),
            /*#__PURE__*/ jsx(Field.Hint, {}),
            /*#__PURE__*/ jsx(Field.Error, {})
        ]
    });
});
// Ensure the conversion to UTC midnight
const toUTCMidnight = (date)=>{
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
};
const MemoizedDateInput = /*#__PURE__*/ React.memo(DateInput);

export { MemoizedDateInput as DateInput };
//# sourceMappingURL=Date.mjs.map
