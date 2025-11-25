import { jsxs, jsx } from 'react/jsx-runtime';
import { Flex, Checkbox, Box, Field, TextInput, NumberInput } from '@strapi/design-system';
import { useIntl } from 'react-intl';

const CheckboxWithNumberField = ({ error, intlLabel, modifiedData, name, onChange, value = null })=>{
    const { formatMessage } = useIntl();
    const label = intlLabel.id ? formatMessage({
        id: intlLabel.id,
        defaultMessage: intlLabel.defaultMessage
    }, {
        ...intlLabel.values
    }) : name;
    const type = modifiedData.type === 'biginteger' ? 'text' : 'number';
    const disabled = !modifiedData.type;
    const errorMessage = error ? formatMessage({
        id: error,
        defaultMessage: error
    }) : '';
    return /*#__PURE__*/ jsxs(Flex, {
        direction: "column",
        alignItems: "stretch",
        gap: 2,
        children: [
            /*#__PURE__*/ jsx(Checkbox, {
                id: name,
                name: name,
                onCheckedChange: (value)=>{
                    const initValue = type === 'text' ? '0' : 0;
                    const nextValue = value ? initValue : null;
                    onChange({
                        target: {
                            name,
                            value: nextValue
                        }
                    });
                },
                checked: value !== null,
                children: label
            }),
            value !== null && /*#__PURE__*/ jsx(Box, {
                paddingLeft: 6,
                style: {
                    maxWidth: '200px'
                },
                children: type === 'text' ? /*#__PURE__*/ jsxs(Field.Root, {
                    error: errorMessage,
                    name: name,
                    children: [
                        /*#__PURE__*/ jsx(TextInput, {
                            "aria-label": label,
                            disabled: disabled,
                            onChange: onChange,
                            value: value === null ? '' : value
                        }),
                        /*#__PURE__*/ jsx(Field.Error, {})
                    ]
                }) : /*#__PURE__*/ jsxs(Field.Root, {
                    error: errorMessage,
                    name: name,
                    children: [
                        /*#__PURE__*/ jsx(NumberInput, {
                            "aria-label": label,
                            disabled: disabled,
                            onValueChange: (value)=>{
                                onChange({
                                    target: {
                                        name,
                                        value: value ?? 0,
                                        type
                                    }
                                });
                            },
                            value: value || 0
                        }),
                        /*#__PURE__*/ jsx(Field.Error, {})
                    ]
                })
            })
        ]
    });
};

export { CheckboxWithNumberField };
//# sourceMappingURL=CheckboxWithNumberField.mjs.map
