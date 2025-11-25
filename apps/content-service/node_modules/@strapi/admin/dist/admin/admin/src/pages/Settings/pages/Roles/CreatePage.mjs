import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import * as React from 'react';
import { Main, Flex, Button, Box, Typography, Grid, Field, TextInput, Textarea } from '@strapi/design-system';
import { Check } from '@strapi/icons';
import { format } from 'date-fns';
import { Formik, Form } from 'formik';
import { useIntl } from 'react-intl';
import { useParams, useNavigate } from 'react-router-dom';
import { styled } from 'styled-components';
import * as yup from 'yup';
import { Layouts } from '../../../../components/Layouts/Layout.mjs';
import { Page } from '../../../../components/PageHelpers.mjs';
import { useTypedSelector } from '../../../../core/store/hooks.mjs';
import { BackButton } from '../../../../features/BackButton.mjs';
import { useNotification } from '../../../../features/Notifications.mjs';
import { useTracking } from '../../../../features/Tracking.mjs';
import { useAPIErrorHandler } from '../../../../hooks/useAPIErrorHandler.mjs';
import { useGetRolePermissionLayoutQuery, useGetRolePermissionsQuery, useCreateRoleMutation, useUpdateRolePermissionsMutation } from '../../../../services/users.mjs';
import { isBaseQueryError } from '../../../../utils/baseQuery.mjs';
import { translatedErrors as errorsTrads } from '../../../../utils/translatedErrors.mjs';
import { Permissions } from './components/Permissions.mjs';

/* -------------------------------------------------------------------------------------------------
 * CreatePage
 * -----------------------------------------------------------------------------------------------*/ const CREATE_SCHEMA = yup.object().shape({
    name: yup.string().required(errorsTrads.required.id),
    description: yup.string().required(errorsTrads.required.id)
});
/**
 * TODO: this whole section of the app needs refactoring. Using a ref to
 * manage the state of the child is nonsensical.
 */ const CreatePage = ()=>{
    const { id } = useParams();
    const { toggleNotification } = useNotification();
    const { formatMessage } = useIntl();
    const navigate = useNavigate();
    const permissionsRef = React.useRef(null);
    const { trackUsage } = useTracking();
    const { _unstableFormatAPIError: formatAPIError, _unstableFormatValidationErrors: formatValidationErrors } = useAPIErrorHandler();
    const { isLoading: isLoadingPermissionsLayout, currentData: permissionsLayout } = useGetRolePermissionLayoutQuery({
        /**
       * Role here is a query param so if there's no role we pass an empty string
       * which returns us a default layout.
       */ role: id ?? ''
    });
    /**
   * We need this so if we're cloning a role, we can fetch
   * the current permissions that role has.
   */ const { currentData: rolePermissions, isLoading: isLoadingRole } = useGetRolePermissionsQuery({
        id: id
    }, {
        skip: !id,
        refetchOnMountOrArgChange: true
    });
    const [createRole] = useCreateRoleMutation();
    const [updateRolePermissions] = useUpdateRolePermissionsMutation();
    const handleCreateRoleSubmit = async (data, formik)=>{
        try {
            if (id) {
                trackUsage('willDuplicateRole');
            } else {
                trackUsage('willCreateNewRole');
            }
            const res = await createRole(data);
            if ('error' in res) {
                if (isBaseQueryError(res.error) && res.error.name === 'ValidationError') {
                    formik.setErrors(formatValidationErrors(res.error));
                } else {
                    toggleNotification({
                        type: 'danger',
                        message: formatAPIError(res.error)
                    });
                }
                return;
            }
            const { permissionsToSend } = permissionsRef.current?.getPermissions() ?? {};
            if (res.data.id && Array.isArray(permissionsToSend) && permissionsToSend.length > 0) {
                const updateRes = await updateRolePermissions({
                    id: res.data.id,
                    permissions: permissionsToSend
                });
                if ('error' in updateRes) {
                    if (isBaseQueryError(updateRes.error) && updateRes.error.name === 'ValidationError') {
                        formik.setErrors(formatValidationErrors(updateRes.error));
                    } else {
                        toggleNotification({
                            type: 'danger',
                            message: formatAPIError(updateRes.error)
                        });
                    }
                    return;
                }
            }
            toggleNotification({
                type: 'success',
                message: formatMessage({
                    id: 'Settings.roles.created',
                    defaultMessage: 'created'
                })
            });
            navigate(`../roles/${res.data.id.toString()}`, {
                replace: true
            });
        } catch (err) {
            toggleNotification({
                type: 'danger',
                message: formatMessage({
                    id: 'notification.error',
                    defaultMessage: 'An error occurred'
                })
            });
        }
    };
    if (isLoadingPermissionsLayout && isLoadingRole || !permissionsLayout) {
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
                initialValues: {
                    name: '',
                    description: `${formatMessage({
                        id: 'Settings.roles.form.created',
                        defaultMessage: 'Created'
                    })} ${format(new Date(), 'PPP')}`
                },
                onSubmit: handleCreateRoleSubmit,
                validationSchema: CREATE_SCHEMA,
                validateOnChange: false,
                children: ({ values, errors, handleReset, handleChange, isSubmitting })=>/*#__PURE__*/ jsx(Form, {
                        children: /*#__PURE__*/ jsxs(Fragment, {
                            children: [
                                /*#__PURE__*/ jsx(Layouts.Header, {
                                    primaryAction: /*#__PURE__*/ jsxs(Flex, {
                                        gap: 2,
                                        children: [
                                            /*#__PURE__*/ jsx(Button, {
                                                variant: "secondary",
                                                onClick: ()=>{
                                                    handleReset();
                                                    permissionsRef.current?.resetForm();
                                                },
                                                children: formatMessage({
                                                    id: 'app.components.Button.reset',
                                                    defaultMessage: 'Reset'
                                                })
                                            }),
                                            /*#__PURE__*/ jsx(Button, {
                                                type: "submit",
                                                loading: isSubmitting,
                                                startIcon: /*#__PURE__*/ jsx(Check, {}),
                                                children: formatMessage({
                                                    id: 'global.save',
                                                    defaultMessage: 'Save'
                                                })
                                            })
                                        ]
                                    }),
                                    title: formatMessage({
                                        id: 'Settings.roles.create.title',
                                        defaultMessage: 'Create a role'
                                    }),
                                    subtitle: formatMessage({
                                        id: 'Settings.roles.create.description',
                                        defaultMessage: 'Define the rights given to the role'
                                    }),
                                    navigationAction: /*#__PURE__*/ jsx(BackButton, {
                                        fallback: "../roles"
                                    })
                                }),
                                /*#__PURE__*/ jsx(Layouts.Content, {
                                    children: /*#__PURE__*/ jsxs(Flex, {
                                        direction: "column",
                                        alignItems: "stretch",
                                        gap: 6,
                                        children: [
                                            /*#__PURE__*/ jsx(Box, {
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
                                                                                children: formatMessage({
                                                                                    id: 'global.details',
                                                                                    defaultMessage: 'Details'
                                                                                })
                                                                            })
                                                                        }),
                                                                        /*#__PURE__*/ jsx(Box, {
                                                                            children: /*#__PURE__*/ jsx(Typography, {
                                                                                variant: "pi",
                                                                                textColor: "neutral600",
                                                                                children: formatMessage({
                                                                                    id: 'Settings.roles.form.description',
                                                                                    defaultMessage: 'Name and description of the role'
                                                                                })
                                                                            })
                                                                        })
                                                                    ]
                                                                }),
                                                                /*#__PURE__*/ jsx(UsersRoleNumber, {
                                                                    children: formatMessage({
                                                                        id: 'Settings.roles.form.button.users-with-role',
                                                                        defaultMessage: '{number, plural, =0 {# users} one {# user} other {# users}} with this role'
                                                                    }, {
                                                                        number: 0
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
                                                                                onChange: handleChange,
                                                                                value: values.name
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
                                                                                onChange: handleChange,
                                                                                value: values.description
                                                                            })
                                                                        ]
                                                                    })
                                                                })
                                                            ]
                                                        })
                                                    ]
                                                })
                                            }),
                                            /*#__PURE__*/ jsx(Box, {
                                                shadow: "filterShadow",
                                                hasRadius: true,
                                                children: /*#__PURE__*/ jsx(Permissions, {
                                                    isFormDisabled: false,
                                                    ref: permissionsRef,
                                                    permissions: rolePermissions,
                                                    layout: permissionsLayout
                                                })
                                            })
                                        ]
                                    })
                                })
                            ]
                        })
                    })
            })
        ]
    });
};
const UsersRoleNumber = styled.div`
  border: 1px solid ${({ theme })=>theme.colors.primary200};
  background: ${({ theme })=>theme.colors.primary100};
  padding: ${({ theme })=>`${theme.spaces[2]} ${theme.spaces[4]}`};
  color: ${({ theme })=>theme.colors.primary600};
  border-radius: ${({ theme })=>theme.borderRadius};
  font-size: 1.2rem;
  font-weight: bold;
`;
/* -------------------------------------------------------------------------------------------------
 * ProtectedCreatePage
 * -----------------------------------------------------------------------------------------------*/ const ProtectedCreatePage = ()=>{
    const permissions = useTypedSelector((state)=>state.admin_app.permissions.settings?.roles.create);
    return /*#__PURE__*/ jsx(Page.Protect, {
        permissions: permissions,
        children: /*#__PURE__*/ jsx(CreatePage, {})
    });
};

export { CreatePage, ProtectedCreatePage };
//# sourceMappingURL=CreatePage.mjs.map
