'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var getDateOfExpiration = require('../../pages/ApiTokens/EditView/utils/getDateOfExpiration.js');
var forms = require('../../utils/forms.js');

const LifeSpanInput = ({ token, error, value, onChange, isCreating })=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
                error: error ? formatMessage(forms.isErrorMessageMessageDescriptor(error) ? error : {
                    id: error,
                    defaultMessage: error
                }) : undefined,
                name: "lifespan",
                required: true,
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                        children: formatMessage({
                            id: 'Settings.tokens.form.duration',
                            defaultMessage: 'Token duration'
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsxs(designSystem.SingleSelect, {
                        value: value,
                        onChange: (value)=>{
                            // @ts-expect-error – DS v2 won't support number types for select
                            onChange({
                                target: {
                                    name: 'lifespan',
                                    value
                                }
                            });
                        },
                        disabled: !isCreating,
                        placeholder: "Select",
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelectOption, {
                                value: "604800000",
                                children: formatMessage({
                                    id: 'Settings.tokens.duration.7-days',
                                    defaultMessage: '7 days'
                                })
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelectOption, {
                                value: "2592000000",
                                children: formatMessage({
                                    id: 'Settings.tokens.duration.30-days',
                                    defaultMessage: '30 days'
                                })
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelectOption, {
                                value: "7776000000",
                                children: formatMessage({
                                    id: 'Settings.tokens.duration.90-days',
                                    defaultMessage: '90 days'
                                })
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelectOption, {
                                value: "0",
                                children: formatMessage({
                                    id: 'Settings.tokens.duration.unlimited',
                                    defaultMessage: 'Unlimited'
                                })
                            })
                        ]
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Error, {})
                ]
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                variant: "pi",
                textColor: "neutral600",
                children: !isCreating && `${formatMessage({
                    id: 'Settings.tokens.duration.expiration-date',
                    defaultMessage: 'Expiration date'
                })}: ${getDateOfExpiration.getDateOfExpiration(token?.createdAt, parseInt(value ?? '', 10))}`
            })
        ]
    });
};

exports.LifeSpanInput = LifeSpanInput;
//# sourceMappingURL=LifeSpanInput.js.map
