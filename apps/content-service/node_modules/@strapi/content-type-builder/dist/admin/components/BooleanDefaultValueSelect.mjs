import { jsxs, jsx } from 'react/jsx-runtime';
import { Field, SingleSelect, SingleSelectOption } from '@strapi/design-system';
import { useIntl } from 'react-intl';

const BooleanDefaultValueSelect = ({ intlLabel, name, options, onChange, value = null })=>{
    const { formatMessage } = useIntl();
    const label = intlLabel.id ? formatMessage({
        id: intlLabel.id,
        defaultMessage: intlLabel.defaultMessage
    }, {
        ...intlLabel.values
    }) : name;
    const handleChange = (value)=>{
        let nextValue = '';
        if (value === 'true') {
            nextValue = true;
        }
        if (value === 'false') {
            nextValue = false;
        }
        onChange({
            target: {
                name,
                value: nextValue,
                type: 'select-default-boolean'
            }
        });
    };
    return /*#__PURE__*/ jsxs(Field.Root, {
        name: name,
        children: [
            /*#__PURE__*/ jsx(Field.Label, {
                children: label
            }),
            /*#__PURE__*/ jsx(SingleSelect, {
                onChange: handleChange,
                value: (value === null ? '' : value).toString(),
                children: options.map(({ metadatas: { intlLabel, disabled, hidden }, key, value })=>{
                    return /*#__PURE__*/ jsx(SingleSelectOption, {
                        value: value,
                        disabled: disabled,
                        hidden: hidden,
                        children: intlLabel.defaultMessage
                    }, key);
                })
            })
        ]
    });
};

export { BooleanDefaultValueSelect };
//# sourceMappingURL=BooleanDefaultValueSelect.mjs.map
