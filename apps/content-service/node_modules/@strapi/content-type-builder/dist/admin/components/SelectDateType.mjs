import { jsxs, jsx } from 'react/jsx-runtime';
import { Field, SingleSelect, SingleSelectOption } from '@strapi/design-system';
import { useIntl } from 'react-intl';

const SelectDateType = ({ intlLabel, error = undefined, modifiedData, name, onChange, options, value = '' })=>{
    const { formatMessage } = useIntl();
    const label = formatMessage(intlLabel);
    const errorMessage = error ? formatMessage({
        id: error,
        defaultMessage: error
    }) : '';
    const handleChange = (nextValue)=>{
        onChange({
            target: {
                name,
                value: nextValue,
                type: 'select'
            }
        });
        if (!value) {
            return;
        }
        if (modifiedData.default !== undefined && modifiedData.default !== null) {
            onChange({
                target: {
                    name: 'default',
                    value: null
                }
            });
        }
    };
    return /*#__PURE__*/ jsxs(Field.Root, {
        error: errorMessage,
        name: name,
        children: [
            /*#__PURE__*/ jsx(Field.Label, {
                children: label
            }),
            /*#__PURE__*/ jsx(SingleSelect, {
                onChange: handleChange,
                value: value || '',
                children: options.map(({ metadatas: { intlLabel, disabled, hidden }, key, value })=>{
                    return /*#__PURE__*/ jsx(SingleSelectOption, {
                        value: value,
                        disabled: disabled,
                        hidden: hidden,
                        children: formatMessage({
                            id: intlLabel.id,
                            defaultMessage: intlLabel.defaultMessage
                        }, intlLabel.values)
                    }, key);
                })
            }),
            /*#__PURE__*/ jsx(Field.Error, {})
        ]
    });
};

export { SelectDateType };
//# sourceMappingURL=SelectDateType.mjs.map
