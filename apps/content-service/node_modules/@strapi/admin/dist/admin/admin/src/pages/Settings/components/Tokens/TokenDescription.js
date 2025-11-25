'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var forms = require('../../utils/forms.js');

const TokenDescription = ({ error, value, onChange, canEditInputs })=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
        name: "description",
        error: error ? formatMessage(forms.isErrorMessageMessageDescriptor(error) ? error : {
            id: error,
            defaultMessage: error
        }) : undefined,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                children: formatMessage({
                    id: 'Settings.tokens.form.description',
                    defaultMessage: 'Description'
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Textarea, {
                onChange: onChange,
                disabled: !canEditInputs,
                value: value
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Error, {})
        ]
    });
};

exports.TokenDescription = TokenDescription;
//# sourceMappingURL=TokenDescription.js.map
