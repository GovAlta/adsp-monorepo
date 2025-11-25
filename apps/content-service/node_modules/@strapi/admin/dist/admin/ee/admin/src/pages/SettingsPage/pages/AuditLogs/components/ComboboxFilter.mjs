import { jsx } from 'react/jsx-runtime';
import { Combobox, ComboboxOption } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { useField } from '../../../../../../../../admin/src/components/Form.mjs';

const ComboboxFilter = (props)=>{
    const { formatMessage } = useIntl();
    const field = useField(props.name);
    const ariaLabel = formatMessage({
        id: 'Settings.permissions.auditLogs.filter.aria-label',
        defaultMessage: 'Search and select an option to filter'
    });
    const handleChange = (value)=>{
        field.onChange(props.name, value);
    };
    return /*#__PURE__*/ jsx(Combobox, {
        "aria-label": ariaLabel,
        value: field.value,
        onChange: handleChange,
        children: props.options?.map((opt)=>{
            const value = typeof opt === 'string' ? opt : opt.value;
            const label = typeof opt === 'string' ? opt : opt.label;
            return /*#__PURE__*/ jsx(ComboboxOption, {
                value: value,
                children: label
            }, value);
        })
    });
};

export { ComboboxFilter };
//# sourceMappingURL=ComboboxFilter.mjs.map
