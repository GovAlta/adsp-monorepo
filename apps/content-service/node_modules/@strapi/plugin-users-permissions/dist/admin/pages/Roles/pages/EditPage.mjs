import { jsx, jsxs } from 'react/jsx-runtime';
import * as React from 'react';
import { Main, Button, Flex, Typography, Grid, Field, TextInput, Textarea } from '@strapi/design-system';
import { Check } from '@strapi/icons';
import { Page, useNotification, useFetchClient, useAPIErrorHandler, Layouts, BackButton } from '@strapi/strapi/admin';
import { Formik, Form } from 'formik';
import { useIntl } from 'react-intl';
import { useQuery, useMutation } from 'react-query';
import { useMatch } from 'react-router-dom';
import UsersPermissions from '../../../components/UsersPermissions/index.mjs';
import { PERMISSIONS } from '../../../constants.mjs';
import getTrad from '../../../utils/getTrad.mjs';
import { createRoleSchema } from '../constants.mjs';
import { usePlugins } from '../hooks/usePlugins.mjs';

const EditPage = ()=>{
    const { formatMessage } = useIntl();
    const { toggleNotification } = useNotification();
    const { params: { id } } = useMatch(`/settings/users-permissions/roles/:id`);
    const { get } = useFetchClient();
    const { isLoading: isLoadingPlugins, routes } = usePlugins();
    const { data: role, isLoading: isLoadingRole, refetch: refetchRole } = useQuery([
        'users-permissions',
        'role',
        id
    ], async ()=>{
        // TODO: why doesn't this endpoint follow the admin API conventions?
        const { data: { role } } = await get(`/users-permissions/roles/${id}`);
        return role;
    });
    const permissionsRef = React.useRef();
    const { put } = useFetchClient();
    const { formatAPIError } = useAPIErrorHandler();
    const mutation = useMutation((body)=>put(`/users-permissions/roles/${id}`, body), {
        onError (error) {
            toggleNotification({
                type: 'danger',
                message: formatAPIError(error)
            });
        },
        async onSuccess () {
            toggleNotification({
                type: 'success',
                message: formatMessage({
                    id: getTrad('Settings.roles.created'),
                    defaultMessage: 'Role edited'
                })
            });
            await refetchRole();
        }
    });
    const handleEditRoleSubmit = async (data)=>{
        const permissions = permissionsRef.current.getPermissions();
        await mutation.mutate({
            ...data,
            ...permissions,
            users: []
        });
    };
    if (isLoadingRole) {
        return /*#__PURE__*/ jsx(Page.Loading, {});
    }
    return /*#__PURE__*/ jsxs(Main, {
        children: [
            /*#__PURE__*/ jsx(Page.Title, {
                children: formatMessage({
                    id: 'Settings.PageTitle',
                    defaultMessage: 'Settings - {name}'
                }, {
                    name: 'Roles'
                })
            }),
            /*#__PURE__*/ jsx(Formik, {
                enableReinitialize: true,
                initialValues: {
                    name: role.name,
                    description: role.description
                },
                onSubmit: handleEditRoleSubmit,
                validationSchema: createRoleSchema,
                children: ({ handleSubmit, values, handleChange, errors })=>/*#__PURE__*/ jsxs(Form, {
                        noValidate: true,
                        onSubmit: handleSubmit,
                        children: [
                            /*#__PURE__*/ jsx(Layouts.Header, {
                                primaryAction: !isLoadingPlugins ? /*#__PURE__*/ jsx(Button, {
                                    disabled: role.code === 'strapi-super-admin',
                                    type: "submit",
                                    loading: mutation.isLoading,
                                    startIcon: /*#__PURE__*/ jsx(Check, {}),
                                    children: formatMessage({
                                        id: 'global.save',
                                        defaultMessage: 'Save'
                                    })
                                }) : null,
                                title: role.name,
                                subtitle: role.description,
                                navigationAction: /*#__PURE__*/ jsx(BackButton, {
                                    fallback: ".."
                                })
                            }),
                            /*#__PURE__*/ jsx(Layouts.Content, {
                                children: /*#__PURE__*/ jsxs(Flex, {
                                    background: "neutral0",
                                    direction: "column",
                                    alignItems: "stretch",
                                    gap: 7,
                                    hasRadius: true,
                                    paddingTop: 6,
                                    paddingBottom: 6,
                                    paddingLeft: 7,
                                    paddingRight: 7,
                                    shadow: "filterShadow",
                                    children: [
                                        /*#__PURE__*/ jsxs(Flex, {
                                            direction: "column",
                                            alignItems: "stretch",
                                            gap: 4,
                                            children: [
                                                /*#__PURE__*/ jsx(Typography, {
                                                    variant: "delta",
                                                    tag: "h2",
                                                    children: formatMessage({
                                                        id: getTrad('EditPage.form.roles'),
                                                        defaultMessage: 'Role details'
                                                    })
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
                                                                error: errors?.name ? formatMessage({
                                                                    id: errors.name,
                                                                    defaultMessage: 'Name is required'
                                                                }) : false,
                                                                required: true,
                                                                children: [
                                                                    /*#__PURE__*/ jsx(Field.Label, {
                                                                        children: formatMessage({
                                                                            id: 'global.name',
                                                                            defaultMessage: 'Name'
                                                                        })
                                                                    }),
                                                                    /*#__PURE__*/ jsx(TextInput, {
                                                                        value: values.name || '',
                                                                        onChange: handleChange
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
                                                                error: errors?.description ? formatMessage({
                                                                    id: errors.description,
                                                                    defaultMessage: 'Description is required'
                                                                }) : false,
                                                                required: true,
                                                                children: [
                                                                    /*#__PURE__*/ jsx(Field.Label, {
                                                                        children: formatMessage({
                                                                            id: 'global.description',
                                                                            defaultMessage: 'Description'
                                                                        })
                                                                    }),
                                                                    /*#__PURE__*/ jsx(Textarea, {
                                                                        value: values.description || '',
                                                                        onChange: handleChange
                                                                    }),
                                                                    /*#__PURE__*/ jsx(Field.Error, {})
                                                                ]
                                                            })
                                                        })
                                                    ]
                                                })
                                            ]
                                        }),
                                        !isLoadingPlugins && /*#__PURE__*/ jsx(UsersPermissions, {
                                            ref: permissionsRef,
                                            permissions: role.permissions,
                                            routes: routes
                                        })
                                    ]
                                })
                            })
                        ]
                    })
            })
        ]
    });
};
const ProtectedRolesEditPage = ()=>/*#__PURE__*/ jsx(Page.Protect, {
        permissions: PERMISSIONS.updateRole,
        children: /*#__PURE__*/ jsx(EditPage, {})
    });

export { EditPage, ProtectedRolesEditPage };
//# sourceMappingURL=EditPage.mjs.map
