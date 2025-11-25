'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var designSystem = require('@strapi/design-system');
var PropTypes = require('prop-types');
var reactIntl = require('react-intl');

const Input = ({ description, disabled, intlLabel, error, name, onChange, placeholder, providerToEditName, type, value })=>{
    const { formatMessage } = reactIntl.useIntl();
    const inputValue = name === 'noName' ? `${window.strapi.backendURL}/api/connect/${providerToEditName}/callback` : value;
    const label = formatMessage({
        id: intlLabel.id,
        defaultMessage: intlLabel.defaultMessage
    }, {
        provider: providerToEditName,
        ...intlLabel.values
    });
    const hint = description ? formatMessage({
        id: description.id,
        defaultMessage: description.defaultMessage
    }, {
        provider: providerToEditName,
        ...description.values
    }) : '';
    if (type === 'bool') {
        return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
            hint: hint,
            name: name,
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                    children: label
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Toggle, {
                    "aria-label": name,
                    checked: value,
                    disabled: disabled,
                    offLabel: formatMessage({
                        id: 'app.components.ToggleCheckbox.off-label',
                        defaultMessage: 'Off'
                    }),
                    onLabel: formatMessage({
                        id: 'app.components.ToggleCheckbox.on-label',
                        defaultMessage: 'On'
                    }),
                    onChange: (e)=>{
                        onChange({
                            target: {
                                name,
                                value: e.target.checked
                            }
                        });
                    }
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Hint, {})
            ]
        });
    }
    const formattedPlaceholder = placeholder ? formatMessage({
        id: placeholder.id,
        defaultMessage: placeholder.defaultMessage
    }, {
        ...placeholder.values
    }) : '';
    const errorMessage = error ? formatMessage({
        id: error,
        defaultMessage: error
    }) : '';
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
        error: errorMessage,
        name: name,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                children: label
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.TextInput, {
                disabled: disabled,
                onChange: onChange,
                placeholder: formattedPlaceholder,
                type: type,
                value: inputValue
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Error, {})
        ]
    });
};
Input.defaultProps = {
    description: null,
    disabled: false,
    error: '',
    placeholder: null,
    value: ''
};
Input.propTypes = {
    description: PropTypes.shape({
        id: PropTypes.string.isRequired,
        defaultMessage: PropTypes.string.isRequired,
        values: PropTypes.object
    }),
    disabled: PropTypes.bool,
    error: PropTypes.string,
    intlLabel: PropTypes.shape({
        id: PropTypes.string.isRequired,
        defaultMessage: PropTypes.string.isRequired,
        values: PropTypes.object
    }).isRequired,
    name: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    placeholder: PropTypes.shape({
        id: PropTypes.string.isRequired,
        defaultMessage: PropTypes.string.isRequired,
        values: PropTypes.object
    }),
    providerToEditName: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([
        PropTypes.bool,
        PropTypes.string
    ])
};

module.exports = Input;
//# sourceMappingURL=index.js.map
