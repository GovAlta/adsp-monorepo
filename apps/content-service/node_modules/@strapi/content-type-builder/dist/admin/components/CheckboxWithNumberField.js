'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');

const CheckboxWithNumberField = ({ error, intlLabel, modifiedData, name, onChange, value = null })=>{
    const { formatMessage } = reactIntl.useIntl();
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
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
        direction: "column",
        alignItems: "stretch",
        gap: 2,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Checkbox, {
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
            value !== null && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                paddingLeft: 6,
                style: {
                    maxWidth: '200px'
                },
                children: type === 'text' ? /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
                    error: errorMessage,
                    name: name,
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.TextInput, {
                            "aria-label": label,
                            disabled: disabled,
                            onChange: onChange,
                            value: value === null ? '' : value
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Error, {})
                    ]
                }) : /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
                    error: errorMessage,
                    name: name,
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.NumberInput, {
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
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Error, {})
                    ]
                })
            })
        ]
    });
};

exports.CheckboxWithNumberField = CheckboxWithNumberField;
//# sourceMappingURL=CheckboxWithNumberField.js.map
