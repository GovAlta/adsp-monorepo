'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');

const BooleanDefaultValueSelect = ({ intlLabel, name, options, onChange, value = null })=>{
    const { formatMessage } = reactIntl.useIntl();
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
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
        name: name,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                children: label
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelect, {
                onChange: handleChange,
                value: (value === null ? '' : value).toString(),
                children: options.map(({ metadatas: { intlLabel, disabled, hidden }, key, value })=>{
                    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelectOption, {
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

exports.BooleanDefaultValueSelect = BooleanDefaultValueSelect;
//# sourceMappingURL=BooleanDefaultValueSelect.js.map
