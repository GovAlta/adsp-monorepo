import { jsxs, jsx } from 'react/jsx-runtime';
import { memo, forwardRef } from 'react';
import { useComposedRefs, Field, TimePicker } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { useFocusInputField } from '../../hooks/useFocusInputField.mjs';
import { useField } from '../Form.mjs';

const TimeInput = /*#__PURE__*/ forwardRef(({ name, required, label, hint, labelAction, ...props }, ref)=>{
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
            /*#__PURE__*/ jsx(TimePicker, {
                ref: composedRefs,
                clearLabel: formatMessage({
                    id: 'clearLabel',
                    defaultMessage: 'Clear'
                }),
                onChange: (time)=>{
                    field.onChange(name, `${time}:00.000`);
                },
                onClear: ()=>field.onChange(name, undefined),
                value: field.value ?? '',
                ...props
            }),
            /*#__PURE__*/ jsx(Field.Hint, {}),
            /*#__PURE__*/ jsx(Field.Error, {})
        ]
    });
});
const MemoizedTimeInput = /*#__PURE__*/ memo(TimeInput);

export { MemoizedTimeInput as TimeInput };
//# sourceMappingURL=Time.mjs.map
