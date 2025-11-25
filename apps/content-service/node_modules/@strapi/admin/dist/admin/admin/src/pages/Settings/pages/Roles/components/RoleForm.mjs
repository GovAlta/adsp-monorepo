import { jsx, jsxs } from 'react/jsx-runtime';
import { Box, Flex, Typography, Button, Grid, Field, TextInput, Textarea } from '@strapi/design-system';
import { useIntl } from 'react-intl';

const RoleForm = ({ disabled, role, values, errors, onChange, onBlur })=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsx(Box, {
        background: "neutral0",
        padding: 6,
        shadow: "filterShadow",
        hasRadius: true,
        children: /*#__PURE__*/ jsxs(Flex, {
            direction: "column",
            alignItems: "stretch",
            gap: 4,
            children: [
                /*#__PURE__*/ jsxs(Flex, {
                    justifyContent: "space-between",
                    children: [
                        /*#__PURE__*/ jsxs(Box, {
                            children: [
                                /*#__PURE__*/ jsx(Box, {
                                    children: /*#__PURE__*/ jsx(Typography, {
                                        fontWeight: "bold",
                                        children: role ? role.name : formatMessage({
                                            id: 'global.details',
                                            defaultMessage: 'Details'
                                        })
                                    })
                                }),
                                /*#__PURE__*/ jsx(Box, {
                                    children: /*#__PURE__*/ jsx(Typography, {
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
                        /*#__PURE__*/ jsx(Button, {
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
                /*#__PURE__*/ jsxs(Grid.Root, {
                    gap: 4,
                    children: [
                        /*#__PURE__*/ jsx(Grid.Item, {
                            col: 6,
                            direction: "column",
                            alignItems: "stretch",
                            children: /*#__PURE__*/ jsxs(Field.Root, {
                                name: "name",
                                error: errors.name && formatMessage({
                                    id: errors.name
                                }),
                                required: true,
                                children: [
                                    /*#__PURE__*/ jsx(Field.Label, {
                                        children: formatMessage({
                                            id: 'global.name',
                                            defaultMessage: 'Name'
                                        })
                                    }),
                                    /*#__PURE__*/ jsx(TextInput, {
                                        disabled: disabled,
                                        onChange: onChange,
                                        onBlur: onBlur,
                                        value: values.name || ''
                                    }),
                                    /*#__PURE__*/ jsx(Field.Error, {})
                                ]
                            })
                        }),
                        /*#__PURE__*/ jsx(Grid.Item, {
                            col: 6,
                            direction: "column",
                            alignItems: "stretch",
                            children: /*#__PURE__*/ jsxs(Field.Root, {
                                name: "description",
                                error: errors.description && formatMessage({
                                    id: errors.description
                                }),
                                children: [
                                    /*#__PURE__*/ jsx(Field.Label, {
                                        children: formatMessage({
                                            id: 'global.description',
                                            defaultMessage: 'Description'
                                        })
                                    }),
                                    /*#__PURE__*/ jsx(Textarea, {
                                        disabled: disabled,
                                        onChange: onChange,
                                        onBlur: onBlur,
                                        value: values.description
                                    }),
                                    /*#__PURE__*/ jsx(Field.Error, {})
                                ]
                            })
                        })
                    ]
                })
            ]
        })
    });
};

export { RoleForm };
//# sourceMappingURL=RoleForm.mjs.map
