'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var forms = require('../../utils/forms.js');

const TokenName = ({ error, value, onChange, canEditInputs })=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
        name: "name",
        error: error ? formatMessage(forms.isErrorMessageMessageDescriptor(error) ? error : {
            id: error,
            defaultMessage: error
        }) : undefined,
        required: true,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                children: formatMessage({
                    id: 'Settings.tokens.form.name',
                    defaultMessage: 'Name'
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.TextInput, {
                onChange: onChange,
                value: value,
                disabled: !canEditInputs
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Error, {})
        ]
    });
};

exports.TokenName = TokenName;
//# sourceMappingURL=TokenName.js.map
