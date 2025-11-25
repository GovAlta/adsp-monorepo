'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');

const SelectNumber = ({ intlLabel, error = undefined, modifiedData, name, onChange, options, value = '' })=>{
    const { formatMessage } = reactIntl.useIntl();
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
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
        error: errorMessage,
        name: name,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                children: label
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelect, {
                onChange: handleChange,
                value: value || '',
                children: options.map(({ metadatas: { intlLabel, disabled, hidden }, key, value })=>{
                    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelectOption, {
                        value: value,
                        disabled: disabled,
                        hidden: hidden,
                        children: formatMessage(intlLabel)
                    }, key);
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Error, {})
        ]
    });
};

exports.SelectNumber = SelectNumber;
//# sourceMappingURL=SelectNumber.js.map
