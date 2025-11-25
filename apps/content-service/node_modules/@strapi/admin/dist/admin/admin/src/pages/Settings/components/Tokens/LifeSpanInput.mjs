import { jsxs, Fragment, jsx } from 'react/jsx-runtime';
import { Field, SingleSelect, SingleSelectOption, Typography } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { getDateOfExpiration } from '../../pages/ApiTokens/EditView/utils/getDateOfExpiration.mjs';
import { isErrorMessageMessageDescriptor } from '../../utils/forms.mjs';

const LifeSpanInput = ({ token, error, value, onChange, isCreating })=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            /*#__PURE__*/ jsxs(Field.Root, {
                error: error ? formatMessage(isErrorMessageMessageDescriptor(error) ? error : {
                    id: error,
                    defaultMessage: error
                }) : undefined,
                name: "lifespan",
                required: true,
                children: [
                    /*#__PURE__*/ jsx(Field.Label, {
                        children: formatMessage({
                            id: 'Settings.tokens.form.duration',
                            defaultMessage: 'Token duration'
                        })
                    }),
                    /*#__PURE__*/ jsxs(SingleSelect, {
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
                            /*#__PURE__*/ jsx(SingleSelectOption, {
                                value: "604800000",
                                children: formatMessage({
                                    id: 'Settings.tokens.duration.7-days',
                                    defaultMessage: '7 days'
                                })
                            }),
                            /*#__PURE__*/ jsx(SingleSelectOption, {
                                value: "2592000000",
                                children: formatMessage({
                                    id: 'Settings.tokens.duration.30-days',
                                    defaultMessage: '30 days'
                                })
                            }),
                            /*#__PURE__*/ jsx(SingleSelectOption, {
                                value: "7776000000",
                                children: formatMessage({
                                    id: 'Settings.tokens.duration.90-days',
                                    defaultMessage: '90 days'
                                })
                            }),
                            /*#__PURE__*/ jsx(SingleSelectOption, {
                                value: "0",
                                children: formatMessage({
                                    id: 'Settings.tokens.duration.unlimited',
                                    defaultMessage: 'Unlimited'
                                })
                            })
                        ]
                    }),
                    /*#__PURE__*/ jsx(Field.Error, {})
                ]
            }),
            /*#__PURE__*/ jsx(Typography, {
                variant: "pi",
                textColor: "neutral600",
                children: !isCreating && `${formatMessage({
                    id: 'Settings.tokens.duration.expiration-date',
                    defaultMessage: 'Expiration date'
                })}: ${getDateOfExpiration(token?.createdAt, parseInt(value ?? '', 10))}`
            })
        ]
    });
};

export { LifeSpanInput };
//# sourceMappingURL=LifeSpanInput.mjs.map
