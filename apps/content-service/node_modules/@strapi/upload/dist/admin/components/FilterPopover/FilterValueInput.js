'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');

const FilterValueInput = ({ label = '', onChange, options = [], type, value = '' })=>{
    const { formatMessage } = reactIntl.useIntl();
    if (type === 'date') {
        return /*#__PURE__*/ jsxRuntime.jsx(designSystem.DateTimePicker, {
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
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelect, {
        "aria-label": label,
        onChange: (value)=>onChange(value.toString()),
        value: value,
        children: options?.map((option)=>{
            return /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelectOption, {
                value: option.value,
                children: option.label
            }, option.value);
        })
    });
};

exports.FilterValueInput = FilterValueInput;
//# sourceMappingURL=FilterValueInput.js.map
