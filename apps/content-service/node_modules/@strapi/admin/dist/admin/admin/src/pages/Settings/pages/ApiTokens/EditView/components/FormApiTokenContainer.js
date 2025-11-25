'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var LifeSpanInput = require('../../../../components/Tokens/LifeSpanInput.js');
var TokenDescription = require('../../../../components/Tokens/TokenDescription.js');
var TokenName = require('../../../../components/Tokens/TokenName.js');
var TokenTypeSelect = require('../../../../components/Tokens/TokenTypeSelect.js');

const FormApiTokenContainer = ({ errors = {}, onChange, canEditInputs, isCreating, values = {}, apiToken = {}, onDispatch, setHasChangedPermissions })=>{
    const { formatMessage } = reactIntl.useIntl();
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
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
        background: "neutral0",
        hasRadius: true,
        shadow: "filterShadow",
        paddingTop: 6,
        paddingBottom: 6,
        paddingLeft: 7,
        paddingRight: 7,
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
            direction: "column",
            alignItems: "stretch",
            gap: 4,
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                    variant: "delta",
                    tag: "h2",
                    children: formatMessage({
                        id: 'global.details',
                        defaultMessage: 'Details'
                    })
                }),
                /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Grid.Root, {
                    gap: 5,
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                            col: 6,
                            xs: 12,
                            direction: "column",
                            alignItems: "stretch",
                            children: /*#__PURE__*/ jsxRuntime.jsx(TokenName.TokenName, {
                                error: errors['name'],
                                value: values['name'],
                                canEditInputs: canEditInputs,
                                onChange: onChange
                            })
                        }, "name"),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                            col: 6,
                            xs: 12,
                            direction: "column",
                            alignItems: "stretch",
                            children: /*#__PURE__*/ jsxRuntime.jsx(TokenDescription.TokenDescription, {
                                error: errors['description'],
                                value: values['description'],
                                canEditInputs: canEditInputs,
                                onChange: onChange
                            })
                        }, "description"),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                            col: 6,
                            xs: 12,
                            direction: "column",
                            alignItems: "stretch",
                            children: /*#__PURE__*/ jsxRuntime.jsx(LifeSpanInput.LifeSpanInput, {
                                isCreating: isCreating,
                                error: errors['lifespan'],
                                value: values['lifespan'],
                                onChange: onChange,
                                token: apiToken
                            })
                        }, "lifespan"),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                            col: 6,
                            xs: 12,
                            direction: "column",
                            alignItems: "stretch",
                            children: /*#__PURE__*/ jsxRuntime.jsx(TokenTypeSelect.TokenTypeSelect, {
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

exports.FormApiTokenContainer = FormApiTokenContainer;
//# sourceMappingURL=FormApiTokenContainer.js.map
