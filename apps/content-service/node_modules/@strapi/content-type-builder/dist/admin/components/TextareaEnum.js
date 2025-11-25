'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');

const TextareaEnum = ({ description = null, disabled = false, error = '', intlLabel, labelAction, name, onChange, placeholder = null, value = '' })=>{
    const { formatMessage } = reactIntl.useIntl();
    const errorMessage = error ? formatMessage({
        id: error,
        defaultMessage: error
    }) : '';
    const hint = description ? formatMessage({
        id: description.id,
        defaultMessage: description.defaultMessage
    }, {
        ...description.values
    }) : '';
    const label = formatMessage(intlLabel);
    const formattedPlaceholder = placeholder ? formatMessage({
        id: placeholder.id,
        defaultMessage: placeholder.defaultMessage
    }, {
        ...placeholder.values
    }) : '';
    const inputValue = Array.isArray(value) ? value.join('\n') : '';
    const handleChange = (e)=>{
        const arrayValue = e.target.value.split('\n');
        onChange({
            target: {
                name,
                value: arrayValue
            }
        });
    };
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
        error: errorMessage,
        hint: hint,
        name: name,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                action: labelAction,
                children: label
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Textarea, {
                disabled: disabled,
                onChange: handleChange,
                placeholder: formattedPlaceholder,
                value: inputValue
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Error, {}),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Hint, {})
        ]
    });
};

exports.TextareaEnum = TextareaEnum;
//# sourceMappingURL=TextareaEnum.js.map
