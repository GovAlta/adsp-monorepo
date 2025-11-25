'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');

const RoleForm = ({ disabled, role, values, errors, onChange, onBlur })=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
        background: "neutral0",
        padding: 6,
        shadow: "filterShadow",
        hasRadius: true,
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
            direction: "column",
            alignItems: "stretch",
            gap: 4,
            children: [
                /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                    justifyContent: "space-between",
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Box, {
                            children: [
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                        fontWeight: "bold",
                                        children: role ? role.name : formatMessage({
                                            id: 'global.details',
                                            defaultMessage: 'Details'
                                        })
                                    })
                                }),
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                        textColor: "neutral500",
                                        variant: "pi",
                                        children: role ? role.description : formatMessage({
                                            id: 'Settings.roles.form.description',
                                            defaultMessage: 'Name and description of the role'
                                        })
                                    })
                                })
                            ]
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                            disabled: true,
                            variant: "secondary",
                            children: formatMessage({
                                id: 'Settings.roles.form.button.users-with-role',
                                defaultMessage: '{number, plural, =0 {# users} one {# user} other {# users}} with this role'
                            }, {
                                number: role.usersCount
                            })
                        })
                    ]
                }),
                /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Grid.Root, {
                    gap: 4,
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                            col: 6,
                            direction: "column",
                            alignItems: "stretch",
                            children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
                                name: "name",
                                error: errors.name && formatMessage({
                                    id: errors.name
                                }),
                                required: true,
                                children: [
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                                        children: formatMessage({
                                            id: 'global.name',
                                            defaultMessage: 'Name'
                                        })
                                    }),
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.TextInput, {
                                        disabled: disabled,
                                        onChange: onChange,
                                        onBlur: onBlur,
                                        value: values.name || ''
                                    }),
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Error, {})
                                ]
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                            col: 6,
                            direction: "column",
                            alignItems: "stretch",
                            children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
                                name: "description",
                                error: errors.description && formatMessage({
                                    id: errors.description
                                }),
                                children: [
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                                        children: formatMessage({
                                            id: 'global.description',
                                            defaultMessage: 'Description'
                                        })
                                    }),
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Textarea, {
                                        disabled: disabled,
                                        onChange: onChange,
                                        onBlur: onBlur,
                                        value: values.description
                                    }),
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Error, {})
                                ]
                            })
                        })
                    ]
                })
            ]
        })
    });
};

exports.RoleForm = RoleForm;
//# sourceMappingURL=RoleForm.js.map
