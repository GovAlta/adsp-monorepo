import { jsx, jsxs } from 'react/jsx-runtime';
import 'react';
import { Box, Flex, Typography, Grid } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { LifeSpanInput } from '../../../../components/Tokens/LifeSpanInput.mjs';
import { TokenDescription } from '../../../../components/Tokens/TokenDescription.mjs';
import { TokenName } from '../../../../components/Tokens/TokenName.mjs';
import { TokenTypeSelect } from '../../../../components/Tokens/TokenTypeSelect.mjs';

const FormApiTokenContainer = ({ errors = {}, onChange, canEditInputs, isCreating, values = {}, apiToken = {}, onDispatch, setHasChangedPermissions })=>{
    const { formatMessage } = useIntl();
    const handleChangeSelectApiTokenType = ({ target: { value } })=>{
        setHasChangedPermissions(false);
        if (value === 'full-access') {
            onDispatch({
                type: 'SELECT_ALL_ACTIONS'
            });
        }
        if (value === 'read-only') {
            onDispatch({
                type: 'ON_CHANGE_READ_ONLY'
            });
        }
    };
    const typeOptions = [
        {
            value: 'read-only',
            label: {
                id: 'Settings.tokens.types.read-only',
                defaultMessage: 'Read-only'
            }
        },
        {
            value: 'full-access',
            label: {
                id: 'Settings.tokens.types.full-access',
                defaultMessage: 'Full access'
            }
        },
        {
            value: 'custom',
            label: {
                id: 'Settings.tokens.types.custom',
                defaultMessage: 'Custom'
            }
        }
    ];
    return /*#__PURE__*/ jsx(Box, {
        background: "neutral0",
        hasRadius: true,
        shadow: "filterShadow",
        paddingTop: 6,
        paddingBottom: 6,
        paddingLeft: 7,
        paddingRight: 7,
        children: /*#__PURE__*/ jsxs(Flex, {
            direction: "column",
            alignItems: "stretch",
            gap: 4,
            children: [
                /*#__PURE__*/ jsx(Typography, {
                    variant: "delta",
                    tag: "h2",
                    children: formatMessage({
                        id: 'global.details',
                        defaultMessage: 'Details'
                    })
                }),
                /*#__PURE__*/ jsxs(Grid.Root, {
                    gap: 5,
                    children: [
                        /*#__PURE__*/ jsx(Grid.Item, {
                            col: 6,
                            xs: 12,
                            direction: "column",
                            alignItems: "stretch",
                            children: /*#__PURE__*/ jsx(TokenName, {
                                error: errors['name'],
                                value: values['name'],
                                canEditInputs: canEditInputs,
                                onChange: onChange
                            })
                        }, "name"),
                        /*#__PURE__*/ jsx(Grid.Item, {
                            col: 6,
                            xs: 12,
                            direction: "column",
                            alignItems: "stretch",
                            children: /*#__PURE__*/ jsx(TokenDescription, {
                                error: errors['description'],
                                value: values['description'],
                                canEditInputs: canEditInputs,
                                onChange: onChange
                            })
                        }, "description"),
                        /*#__PURE__*/ jsx(Grid.Item, {
                            col: 6,
                            xs: 12,
                            direction: "column",
                            alignItems: "stretch",
                            children: /*#__PURE__*/ jsx(LifeSpanInput, {
                                isCreating: isCreating,
                                error: errors['lifespan'],
                                value: values['lifespan'],
                                onChange: onChange,
                                token: apiToken
                            })
                        }, "lifespan"),
                        /*#__PURE__*/ jsx(Grid.Item, {
                            col: 6,
                            xs: 12,
                            direction: "column",
                            alignItems: "stretch",
                            children: /*#__PURE__*/ jsx(TokenTypeSelect, {
                                value: values['type'],
                                error: errors['type'],
                                label: {
                                    id: 'Settings.tokens.form.type',
                                    defaultMessage: 'Token type'
                                },
                                onChange: (value)=>{
                                    // @ts-expect-error – DS Select supports numbers & strings, will be removed in V2
                                    handleChangeSelectApiTokenType({
                                        target: {
                                            value
                                        }
                                    });
                                    // @ts-expect-error – DS Select supports numbers & strings, will be removed in V2
                                    onChange({
                                        target: {
                                            name: 'type',
                                            value
                                        }
                                    });
                                },
                                options: typeOptions,
                                canEditInputs: canEditInputs
                            })
                        }, "type")
                    ]
                })
            ]
        })
    });
};

export { FormApiTokenContainer };
//# sourceMappingURL=FormApiTokenContainer.mjs.map
