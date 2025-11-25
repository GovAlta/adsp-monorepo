'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var Form = require('../../../../../../../../admin/src/components/Form.js');

const ComboboxFilter = (props)=>{
    const { formatMessage } = reactIntl.useIntl();
    const field = Form.useField(props.name);
    const ariaLabel = formatMessage({
        id: 'Settings.permissions.auditLogs.filter.aria-label',
        defaultMessage: 'Search and select an option to filter'
    });
    const handleChange = (value)=>{
        field.onChange(props.name, value);
    };
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Combobox, {
        "aria-label": ariaLabel,
        value: field.value,
        onChange: handleChange,
        children: props.options?.map((opt)=>{
            const value = typeof opt === 'string' ? opt : opt.value;
            const label = typeof opt === 'string' ? opt : opt.label;
            return /*#__PURE__*/ jsxRuntime.jsx(designSystem.ComboboxOption, {
                value: value,
                children: label
            }, value);
        })
    });
};

exports.ComboboxFilter = ComboboxFilter;
//# sourceMappingURL=ComboboxFilter.js.map
