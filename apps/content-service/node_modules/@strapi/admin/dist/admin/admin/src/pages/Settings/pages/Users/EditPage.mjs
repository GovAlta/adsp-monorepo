import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import * as React from 'react';
import { Button, Box, Flex, Typography, Grid } from '@strapi/design-system';
import { Check } from '@strapi/icons';
import pick from 'lodash/pick';
import { useIntl } from 'react-intl';
import { useMatch, useNavigate } from 'react-router-dom';
import * as yup from 'yup';
import { Form } from '../../../../components/Form.mjs';
import { InputRenderer as MemoizedInputRenderer } from '../../../../components/FormInputs/Renderer.mjs';
import { Layouts } from '../../../../components/Layouts/Layout.mjs';
import { Page } from '../../../../components/PageHelpers.mjs';
import { useTypedSelector } from '../../../../core/store/hooks.mjs';
import { BackButton } from '../../../../features/BackButton.mjs';
import { useNotification } from '../../../../features/Notifications.mjs';
import { useAPIErrorHandler } from '../../../../hooks/useAPIErrorHandler.mjs';
import { useEnterprise } from '../../../../hooks/useEnterprise.mjs';
import { useRBAC } from '../../../../hooks/useRBAC.mjs';
import { selectAdminPermissions } from '../../../../selectors.mjs';
import { useUpdateUserMutation, useAdminUsers } from '../../../../services/users.mjs';
import { isBaseQueryError } from '../../../../utils/baseQuery.mjs';
import { translatedErrors as errorsTrads } from '../../../../utils/translatedErrors.mjs';
import { getDisplayName } from '../../../../utils/users.mjs';
import { MagicLinkCE } from './components/MagicLinkCE.mjs';
import { SelectRoles } from './components/SelectRoles.mjs';
import { COMMON_USER_SCHEMA } from './utils/validation.mjs';

const EDIT_VALIDATION_SCHEMA = yup.object().shape({
    ...COMMON_USER_SCHEMA,
    isActive: yup.bool(),
    roles: yup.array().min(1, {
        id: errorsTrads.required.id,
        defaultMessage: 'This field is required'
    }).required({
        id: errorsTrads.required.id,
        defaultMessage: 'This field is required'
    })
});
const fieldsToPick = [
    'email',
    'firstname',
    'lastname',
    'username',
    'isActive',
    'roles'
];
/* -------------------------------------------------------------------------------------------------
 * EditPage
 * -----------------------------------------------------------------------------------------------*/ const EditPage = ()=>{
    const { formatMessage } = useIntl();
    const match = useMatch('/settings/users/:id');
    const id = match?.params?.id ?? '';
    const navigate = useNavigate();
    const { toggleNotification } = useNotification();
    const MagicLink = useEnterprise(MagicLinkCE, async ()=>(await import('../../../../../../ee/admin/src/pages/SettingsPage/pages/Users/components/MagicLinkEE.mjs')).MagicLinkEE);
    const { _unstableFormatAPIError: formatAPIError, _unstableFormatValidationErrors: formatValidationErrors } = useAPIErrorHandler();
    const permissions = useTypedSelector(selectAdminPermissions);
    const { isLoading: isLoadingRBAC, allowedActions: { canUpdate } } = useRBAC({
        read: permissions.settings?.users.read ?? [],
        update: permissions.settings?.users.update ?? []
    });
    const [updateUser] = useUpdateUserMutation();
    const { data, error, isLoading: isLoadingAdminUsers } = useAdminUsers({
        id
    }, {
        refetchOnMountOrArgChange: true
    });
    const [user] = data?.users ?? [];
    React.useEffect(()=>{
        if (error) {
            // Redirect the user to the homepage if is not allowed to read
            if (error.name === 'UnauthorizedError') {
                toggleNotification({
                    type: 'info',
                    message: formatMessage({
                        id: 'notification.permission.not-allowed-read',
                        defaultMessage: 'You are not allowed to see this document'
                    })
                });
                navigate('/');
            } else {
                toggleNotification({
                    type: 'danger',
                    message: formatAPIError(error)
                });
            }
        }
    }, [
        error,
        formatAPIError,
        formatMessage,
        navigate,
        toggleNotification
    ]);
    const isLoading = isLoadingAdminUsers || !MagicLink || isLoadingRBAC;
    if (isLoading) {
        return /*#__PURE__*/ jsx(Page.Loading, {});
    }
    const initialData = {
        ...pick(user, fieldsToPick),
        roles: user.roles.map(({ id })=>id),
        password: '',
        confirmPassword: ''
    };
    const handleSubmit = async (body, actions)=>{
        const { confirmPassword: _confirmPassword, ...bodyRest } = body;
        const res = await updateUser({
            id,
            ...bodyRest
        });
        if ('error' in res && isBaseQueryError(res.error)) {
            if (res.error.name === 'ValidationError') {
                actions.setErrors(formatValidationErrors(res.error));
            }
            toggleNotification({
                type: 'danger',
                message: formatAPIError(res.error)
            });
        } else {
            toggleNotification({
                type: 'success',
                message: formatMessage({
                    id: 'notification.success.saved',
                    defaultMessage: 'Saved'
                })
            });
            actions.setValues({
                ...pick(body, fieldsToPick),
                password: '',
                confirmPassword: ''
            });
        }
    };
    return /*#__PURE__*/ jsxs(Page.Main, {
        children: [
            /*#__PURE__*/ jsx(Page.Title, {
                children: formatMessage({
                    id: 'Settings.PageTitle',
                    defaultMessage: 'Settings - {name}'
                }, {
                    name: 'Users'
                })
            }),
            /*#__PURE__*/ jsx(Form, {
                method: "PUT",
                onSubmit: handleSubmit,
                initialValues: initialData,
                validationSchema: EDIT_VALIDATION_SCHEMA,
                children: ({ isSubmitting, modified })=>{
                    return /*#__PURE__*/ jsxs(Fragment, {
                        children: [
                            /*#__PURE__*/ jsx(Layouts.Header, {
                                primaryAction: /*#__PURE__*/ jsx(Button, {
                                    disabled: isSubmitting || !canUpdate || !modified,
                                    startIcon: /*#__PURE__*/ jsx(Check, {}),
                                    loading: isSubmitting,
                                    type: "submit",
                                    children: formatMessage({
                                        id: 'global.save',
                                        defaultMessage: 'Save'
                                    })
                                }),
                                title: formatMessage({
                                    id: 'app.containers.Users.EditPage.header.label',
                                    defaultMessage: 'Edit {name}'
                                }, {
                                    // @ts-expect-error – issues with the Entity ID type, still.
                                    name: getDisplayName(initialData)
                                }),
                                navigationAction: /*#__PURE__*/ jsx(BackButton, {
                                    fallback: "../users"
                                })
                            }),
                            /*#__PURE__*/ jsxs(Layouts.Content, {
                                children: [
                                    user?.registrationToken && /*#__PURE__*/ jsx(Box, {
                                        paddingBottom: 6,
                                        children: /*#__PURE__*/ jsx(MagicLink, {
                                            registrationToken: user.registrationToken
                                        })
                                    }),
                                    /*#__PURE__*/ jsxs(Flex, {
                                        direction: "column",
                                        alignItems: "stretch",
                                        gap: 7,
                                        children: [
                                            /*#__PURE__*/ jsx(Box, {
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
                                                                id: 'app.components.Users.ModalCreateBody.block-title.details',
                                                                defaultMessage: 'Details'
                                                            })
                                                        }),
                                                        /*#__PURE__*/ jsx(Grid.Root, {
                                                            gap: 5,
                                                            children: LAYOUT.map((row)=>row.map(({ size, label, ...field })=>{
                                                                    return /*#__PURE__*/ jsx(Grid.Item, {
                                                                        col: size,
                                                                        direction: "column",
                                                                        alignItems: "stretch",
                                                                        children: /*#__PURE__*/ jsx(MemoizedInputRenderer, {
                                                                            ...field,
                                                                            disabled: !canUpdate,
                                                                            label: formatMessage(label),
                                                                            placeholder: 'placeholder' in field ? formatMessage(field.placeholder) : undefined
                                                                        })
                                                                    }, field.name);
                                                                }))
                                                        })
                                                    ]
                                                })
                                            }),
                                            /*#__PURE__*/ jsx(Box, {
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
                                                                id: 'global.roles',
                                                                defaultMessage: "User's role"
                                                            })
                                                        }),
                                                        /*#__PURE__*/ jsx(Grid.Root, {
                                                            gap: 5,
                                                            children: /*#__PURE__*/ jsx(Grid.Item, {
                                                                col: 6,
                                                                xs: 12,
                                                                direction: "column",
                                                                alignItems: "stretch",
                                                                children: /*#__PURE__*/ jsx(SelectRoles, {
                                                                    disabled: !canUpdate
                                                                })
                                                            })
                                                        })
                                                    ]
                                                })
                                            })
                                        ]
                                    })
                                ]
                            })
                        ]
                    });
                }
            })
        ]
    });
};
/* -------------------------------------------------------------------------------------------------
 * EditPage LAYOUT
 * -----------------------------------------------------------------------------------------------*/ const LAYOUT = [
    [
        {
            label: {
                id: 'Auth.form.firstname.label',
                defaultMessage: 'First name'
            },
            name: 'firstname',
            placeholder: {
                id: 'Auth.form.firstname.placeholder',
                defaultMessage: 'e.g. Kai'
            },
            type: 'string',
            size: 6,
            required: true
        },
        {
            label: {
                id: 'Auth.form.lastname.label',
                defaultMessage: 'Last name'
            },
            name: 'lastname',
            placeholder: {
                id: 'Auth.form.lastname.placeholder',
                defaultMessage: 'e.g. Doe'
            },
            type: 'string',
            size: 6
        }
    ],
    [
        {
            label: {
                id: 'Auth.form.email.label',
                defaultMessage: 'Email'
            },
            name: 'email',
            placeholder: {
                id: 'Auth.form.email.placeholder',
                defaultMessage: 'e.g. kai.doe@strapi.io'
            },
            type: 'email',
            size: 6,
            required: true
        },
        {
            label: {
                id: 'Auth.form.username.label',
                defaultMessage: 'Username'
            },
            name: 'username',
            placeholder: {
                id: 'Auth.form.username.placeholder',
                defaultMessage: 'e.g. Kai_Doe'
            },
            type: 'string',
            size: 6
        }
    ],
    [
        {
            autoComplete: 'new-password',
            label: {
                id: 'global.password',
                defaultMessage: 'Password'
            },
            name: 'password',
            type: 'password',
            size: 6
        },
        {
            autoComplete: 'new-password',
            label: {
                id: 'Auth.form.confirmPassword.label',
                defaultMessage: 'Password confirmation'
            },
            name: 'confirmPassword',
            type: 'password',
            size: 6
        }
    ],
    [
        {
            label: {
                id: 'Auth.form.active.label',
                defaultMessage: 'Active'
            },
            name: 'isActive',
            type: 'boolean',
            size: 6
        }
    ]
];
const ProtectedEditPage = ()=>{
    const permissions = useTypedSelector((state)=>state.admin_app.permissions.settings?.users.read);
    return /*#__PURE__*/ jsx(Page.Protect, {
        permissions: permissions,
        children: /*#__PURE__*/ jsx(EditPage, {})
    });
};

export { EditPage, ProtectedEditPage };
//# sourceMappingURL=EditPage.mjs.map
