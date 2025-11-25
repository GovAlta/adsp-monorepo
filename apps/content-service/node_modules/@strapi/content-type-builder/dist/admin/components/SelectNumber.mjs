import { jsxs, jsx } from 'react/jsx-runtime';
import { Field, SingleSelect, SingleSelectOption } from '@strapi/design-system';
import { useIntl } from 'react-intl';

const SelectNumber = ({ intlLabel, error = undefined, modifiedData, name, onChange, options, value = '' })=>{
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
        if (nextValue === 'biginteger' && value !== 'biginteger') {
            if (modifiedData.default !== undefined && modifiedData.default !== null) {
                onChange({
                    target: {
                        name: 'default',
                        value: null
                    }
                });
            }
            if (modifiedData.max !== undefined && modifiedData.max !== null) {
                onChange({
                    target: {
                        name: 'max',
                        value: null
                    }
                });
            }
            if (modifiedData.min !== undefined && modifiedData.min !== null) {
                onChange({
                    target: {
                        name: 'min',
                        value: null
                    }
                });
            }
        }
        if (typeof nextValue === 'string' && [
            'decimal',
            'float',
            'integer'
        ].includes(nextValue) && value === 'biginteger') {
            if (modifiedData.default !== undefined && modifiedData.default !== null) {
                onChange({
                    target: {
                        name: 'default',
                        value: null
                    }
                });
            }
            if (modifiedData.max !== undefined && modifiedData.max !== null) {
                onChange({
                    target: {
                        name: 'max',
                        value: null
                    }
                });
            }
            if (modifiedData.min !== undefined && modifiedData.min !== null) {
                onChange({
                    target: {
                        name: 'min',
                        value: null
                    }
                });
            }
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
                        children: formatMessage(intlLabel)
                    }, key);
                })
            }),
            /*#__PURE__*/ jsx(Field.Error, {})
        ]
    });
};

export { SelectNumber };
//# sourceMappingURL=SelectNumber.mjs.map
