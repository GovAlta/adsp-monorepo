'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var forms = require('../../utils/forms.js');

const TokenTypeSelect = ({ name = 'type', error, value, onChange, canEditInputs, options = [], label })=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
        error: error ? formatMessage(forms.isErrorMessageMessageDescriptor(error) ? error : {
            id: error,
            defaultMessage: error
        }) : undefined,
        name: name,
        required: true,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                children: formatMessage({
                    id: label.id,
                    defaultMessage: label.defaultMessage
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelect, {
                value: value,
                onChange: onChange,
                placeholder: "Select",
                disabled: !canEditInputs,
                children: options && options.map(({ value, label })=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelectOption, {
                        value: value,
                        children: formatMessage(label)
                    }, value))
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Error, {})
        ]
    });
};

exports.TokenTypeSelect = TokenTypeSelect;
//# sourceMappingURL=TokenTypeSelect.js.map
