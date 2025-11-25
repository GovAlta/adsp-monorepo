import { jsx } from 'react/jsx-runtime';
import { DateTimePicker, SingleSelect, SingleSelectOption } from '@strapi/design-system';
import { useIntl } from 'react-intl';

const FilterValueInput = ({ label = '', onChange, options = [], type, value = '' })=>{
    const { formatMessage } = useIntl();
    if (type === 'date') {
        return /*#__PURE__*/ jsx(DateTimePicker, {
            clearLabel: formatMessage({
                id: 'clearLabel',
                defaultMessage: 'Clear'
            }),
            "aria-label": label,
            name: "datetimepicker",
            onChange: (date)=>{
                const formattedDate = date ? new Date(date).toISOString() : '';
                onChange(formattedDate);
            },
            onClear: ()=>onChange(''),
            value: value ? new Date(value) : undefined
        });
    }
    return /*#__PURE__*/ jsx(SingleSelect, {
        "aria-label": label,
        onChange: (value)=>onChange(value.toString()),
        value: value,
        children: options?.map((option)=>{
            return /*#__PURE__*/ jsx(SingleSelectOption, {
                value: option.value,
                children: option.label
            }, option.value);
        })
    });
};

export { FilterValueInput };
//# sourceMappingURL=FilterValueInput.mjs.map
