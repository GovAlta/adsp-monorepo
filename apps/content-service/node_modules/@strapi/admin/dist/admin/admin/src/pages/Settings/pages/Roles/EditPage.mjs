import { jsx, jsxs } from 'react/jsx-runtime';
import * as React from 'react';
import { Main, Flex, Button, Box } from '@strapi/design-system';
import { Check } from '@strapi/icons';
import { Formik } from 'formik';
import { useIntl } from 'react-intl';
import { useMatch, Navigate } from 'react-router-dom';
import * as yup from 'yup';
import { Layouts } from '../../../../components/Layouts/Layout.mjs';
import { Page } from '../../../../components/PageHelpers.mjs';
import { useTypedSelector } from '../../../../core/store/hooks.mjs';
import { BackButton } from '../../../../features/BackButton.mjs';
import { useNotification } from '../../../../features/Notifications.mjs';
import { useTracking } from '../../../../features/Tracking.mjs';
import { useAdminRoles } from '../../../../hooks/useAdminRoles.mjs';
import { useAPIErrorHandler } from '../../../../hooks/useAPIErrorHandler.mjs';
import { useGetRolePermissionLayoutQuery, useGetRolePermissionsQuery, useUpdateRoleMutation, useUpdateRolePermissionsMutation } from '../../../../services/users.mjs';
import { isBaseQueryError } from '../../../../utils/baseQuery.mjs';
import { translatedErrors as errorsTrads } from '../../../../utils/translatedErrors.mjs';
import { Permissions } from './components/Permissions.mjs';
import { RoleForm } from './components/RoleForm.mjs';

const EDIT_ROLE_SCHEMA = yup.object().shape({
    name: yup.string().required(errorsTrads.required.id),
    description: yup.string().optional()
});
const EditPage = ()=>{
    const { toggleNotification } = useNotification();
    const { formatMessage } = useIntl();
    const match = useMatch('/settings/roles/:id');
    const id = match?.params.id;
    const permissionsRef = React.useRef(null);
    const { trackUsage } = useTracking();
    const { _unstableFormatAPIError: formatAPIError, _unstableFormatValidationErrors: formatValidationErrors } = useAPIErrorHandler();
    const { isLoading: isLoadingPermissionsLayout, data: permissionsLayout } = useGetRolePermissionLayoutQuery({
        /**
       * Role here is a query param so if there's no role we pass an empty string
       * which returns us a default layout.
       */ role: id ?? ''
    });
    const { roles, isLoading: isRoleLoading, refetch: refetchRole } = useAdminRoles({
        id
    }, {
        refetchOnMountOrArgChange: true
    });
    const role = roles[0] ?? {};
    const { data: permissions, isLoading: isLoadingPermissions } = useGetRolePermissionsQuery({
        id: id
    }, {
        skip: !id,
        refetchOnMountOrArgChange: true
    });
    const [updateRole] = useUpdateRoleMutation();
    const [updateRolePermissions] = useUpdateRolePermissionsMutation();
    if (!id) {
        return /*#__PURE__*/ jsx(Navigate, {
            to: "/settings/roles"
        });
    }
    const handleEditRoleSubmit = async (data, formik)=>{
        try {
            const { permissionsToSend, didUpdateConditions } = permissionsRef.current?.getPermissions() ?? {};
            const res = await updateRole({
                id,
                ...data
            });
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
            if (role.code !== 'strapi-super-admin' && permissionsToSend) {
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
                if (didUpdateConditions) {
                    trackUsage('didUpdateConditions');
                }
            }
            permissionsRef.current?.setFormAfterSubmit();
            await refetchRole();
            toggleNotification({
                type: 'success',
                message: formatMessage({
                    id: 'notification.success.saved'
                })
            });
        } catch (error) {
            toggleNotification({
                type: 'danger',
                message: formatMessage({
                    id: 'notification.error',
                    defaultMessage: 'An error occurred'
                })
            });
        }
    };
    const isFormDisabled = !isRoleLoading && role.code === 'strapi-super-admin';
    if (isLoadingPermissionsLayout || isRoleLoading || isLoadingPermissions || !permissionsLayout) {
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
                    name: role.name ?? '',
                    description: role.description ?? ''
                },
                onSubmit: handleEditRoleSubmit,
                validationSchema: EDIT_ROLE_SCHEMA,
                validateOnChange: false,
                children: ({ handleSubmit, values, errors, handleChange, handleBlur, isSubmitting })=>/*#__PURE__*/ jsxs("form", {
                        onSubmit: handleSubmit,
                        children: [
                            /*#__PURE__*/ jsx(Layouts.Header, {
                                primaryAction: /*#__PURE__*/ jsx(Flex, {
                                    gap: 2,
                                    children: /*#__PURE__*/ jsx(Button, {
                                        type: "submit",
                                        startIcon: /*#__PURE__*/ jsx(Check, {}),
                                        disabled: role.code === 'strapi-super-admin',
                                        loading: isSubmitting,
                                        children: formatMessage({
                                            id: 'global.save',
                                            defaultMessage: 'Save'
                                        })
                                    })
                                }),
                                title: formatMessage({
                                    id: 'Settings.roles.edit.title',
                                    defaultMessage: 'Edit a role'
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
                                        /*#__PURE__*/ jsx(RoleForm, {
                                            disabled: isFormDisabled,
                                            errors: errors,
                                            values: values,
                                            onChange: handleChange,
                                            onBlur: handleBlur,
                                            role: role
                                        }),
                                        /*#__PURE__*/ jsx(Box, {
                                            shadow: "filterShadow",
                                            hasRadius: true,
                                            children: /*#__PURE__*/ jsx(Permissions, {
                                                isFormDisabled: isFormDisabled,
                                                permissions: permissions,
                                                ref: permissionsRef,
                                                layout: permissionsLayout
                                            })
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
const ProtectedEditPage = ()=>{
    const permissions = useTypedSelector((state)=>state.admin_app.permissions.settings?.roles.update);
    return /*#__PURE__*/ jsx(Page.Protect, {
        permissions: permissions,
        children: /*#__PURE__*/ jsx(EditPage, {})
    });
};

export { EditPage, ProtectedEditPage };
//# sourceMappingURL=EditPage.mjs.map
