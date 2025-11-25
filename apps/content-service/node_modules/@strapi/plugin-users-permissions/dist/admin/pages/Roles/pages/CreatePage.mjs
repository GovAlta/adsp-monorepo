import { jsx, jsxs } from 'react/jsx-runtime';
import * as React from 'react';
import { Main, Button, Flex, Typography, Grid, Field, TextInput, Textarea } from '@strapi/design-system';
import { Check } from '@strapi/icons';
import { Page, useNotification, useTracking, useFetchClient, Layouts } from '@strapi/strapi/admin';
import { Formik, Form } from 'formik';
import { useIntl } from 'react-intl';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';
import UsersPermissions from '../../../components/UsersPermissions/index.mjs';
import { PERMISSIONS } from '../../../constants.mjs';
import getTrad from '../../../utils/getTrad.mjs';
import { createRoleSchema } from '../constants.mjs';
import { usePlugins } from '../hooks/usePlugins.mjs';

const CreatePage = ()=>{
    const { formatMessage } = useIntl();
    const { toggleNotification } = useNotification();
    const navigate = useNavigate();
    const { isLoading: isLoadingPlugins, permissions, routes } = usePlugins();
    const { trackUsage } = useTracking();
    const permissionsRef = React.useRef();
    const { post } = useFetchClient();
    const mutation = useMutation((body)=>post(`/users-permissions/roles`, body), {
        onError () {
            toggleNotification({
                type: 'danger',
                message: formatMessage({
                    id: 'notification.error',
                    defaultMessage: 'An error occurred'
                })
            });
        },
        onSuccess () {
            trackUsage('didCreateRole');
            toggleNotification({
                type: 'success',
                message: formatMessage({
                    id: getTrad('Settings.roles.created'),
                    defaultMessage: 'Role created'
                })
            });
            // Forcing redirecting since we don't have the id in the response
            navigate(-1);
        }
    });
    const handleCreateRoleSubmit = async (data)=>{
        // TODO: refactor. Child -> parent component communication is evil;
        // We should either move the provider one level up or move the state
        // straight into redux.
        const permissions = permissionsRef.current.getPermissions();
        await mutation.mutate({
            ...data,
            ...permissions,
            users: []
        });
    };
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
                    name: '',
                    description: ''
                },
                onSubmit: handleCreateRoleSubmit,
                validationSchema: createRoleSchema,
                children: ({ handleSubmit, values, handleChange, errors })=>/*#__PURE__*/ jsxs(Form, {
                        noValidate: true,
                        onSubmit: handleSubmit,
                        children: [
                            /*#__PURE__*/ jsx(Layouts.Header, {
                                primaryAction: !isLoadingPlugins && /*#__PURE__*/ jsx(Button, {
                                    type: "submit",
                                    loading: mutation.isLoading,
                                    startIcon: /*#__PURE__*/ jsx(Check, {}),
                                    children: formatMessage({
                                        id: 'global.save',
                                        defaultMessage: 'Save'
                                    })
                                }),
                                title: formatMessage({
                                    id: 'Settings.roles.create.title',
                                    defaultMessage: 'Create a role'
                                }),
                                subtitle: formatMessage({
                                    id: 'Settings.roles.create.description',
                                    defaultMessage: 'Define the rights given to the role'
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
                                            permissions: permissions,
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
const ProtectedRolesCreatePage = ()=>/*#__PURE__*/ jsx(Page.Protect, {
        permissions: PERMISSIONS.createRole,
        children: /*#__PURE__*/ jsx(CreatePage, {})
    });

export { CreatePage, ProtectedRolesCreatePage };
//# sourceMappingURL=CreatePage.mjs.map
