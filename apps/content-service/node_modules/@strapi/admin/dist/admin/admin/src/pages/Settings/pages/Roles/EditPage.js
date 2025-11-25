'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var formik = require('formik');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var yup = require('yup');
var Layout = require('../../../../components/Layouts/Layout.js');
var PageHelpers = require('../../../../components/PageHelpers.js');
var hooks = require('../../../../core/store/hooks.js');
var BackButton = require('../../../../features/BackButton.js');
var Notifications = require('../../../../features/Notifications.js');
var Tracking = require('../../../../features/Tracking.js');
var useAdminRoles = require('../../../../hooks/useAdminRoles.js');
var useAPIErrorHandler = require('../../../../hooks/useAPIErrorHandler.js');
var users = require('../../../../services/users.js');
var baseQuery = require('../../../../utils/baseQuery.js');
var translatedErrors = require('../../../../utils/translatedErrors.js');
var Permissions = require('./components/Permissions.js');
var RoleForm = require('./components/RoleForm.js');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var React__namespace = /*#__PURE__*/_interopNamespaceDefault(React);
var yup__namespace = /*#__PURE__*/_interopNamespaceDefault(yup);

const EDIT_ROLE_SCHEMA = yup__namespace.object().shape({
    name: yup__namespace.string().required(translatedErrors.translatedErrors.required.id),
    description: yup__namespace.string().optional()
});
const EditPage = ()=>{
    const { toggleNotification } = Notifications.useNotification();
    const { formatMessage } = reactIntl.useIntl();
    const match = reactRouterDom.useMatch('/settings/roles/:id');
    const id = match?.params.id;
    const permissionsRef = React__namespace.useRef(null);
    const { trackUsage } = Tracking.useTracking();
    const { _unstableFormatAPIError: formatAPIError, _unstableFormatValidationErrors: formatValidationErrors } = useAPIErrorHandler.useAPIErrorHandler();
    const { isLoading: isLoadingPermissionsLayout, data: permissionsLayout } = users.useGetRolePermissionLayoutQuery({
        /**
       * Role here is a query param so if there's no role we pass an empty string
       * which returns us a default layout.
       */ role: id ?? ''
    });
    const { roles, isLoading: isRoleLoading, refetch: refetchRole } = useAdminRoles.useAdminRoles({
        id
    }, {
        refetchOnMountOrArgChange: true
    });
    const role = roles[0] ?? {};
    const { data: permissions, isLoading: isLoadingPermissions } = users.useGetRolePermissionsQuery({
        id: id
    }, {
        skip: !id,
        refetchOnMountOrArgChange: true
    });
    const [updateRole] = users.useUpdateRoleMutation();
    const [updateRolePermissions] = users.useUpdateRolePermissionsMutation();
    if (!id) {
        return /*#__PURE__*/ jsxRuntime.jsx(reactRouterDom.Navigate, {
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
                if (baseQuery.isBaseQueryError(res.error) && res.error.name === 'ValidationError') {
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
                    if (baseQuery.isBaseQueryError(updateRes.error) && updateRes.error.name === 'ValidationError') {
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
        return /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Loading, {});
    }
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Main, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Title, {
                children: formatMessage({
                    id: 'Settings.PageTitle',
                    defaultMessage: 'Settings - {name}'
                }, {
                    name: 'Roles'
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(formik.Formik, {
                enableReinitialize: true,
                initialValues: {
                    name: role.name ?? '',
                    description: role.description ?? ''
                },
                onSubmit: handleEditRoleSubmit,
                validationSchema: EDIT_ROLE_SCHEMA,
                validateOnChange: false,
                children: ({ handleSubmit, values, errors, handleChange, handleBlur, isSubmitting })=>/*#__PURE__*/ jsxRuntime.jsxs("form", {
                        onSubmit: handleSubmit,
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(Layout.Layouts.Header, {
                                primaryAction: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                                    gap: 2,
                                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                        type: "submit",
                                        startIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.Check, {}),
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
                                navigationAction: /*#__PURE__*/ jsxRuntime.jsx(BackButton.BackButton, {
                                    fallback: "../roles"
                                })
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(Layout.Layouts.Content, {
                                children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                    direction: "column",
                                    alignItems: "stretch",
                                    gap: 6,
                                    children: [
                                        /*#__PURE__*/ jsxRuntime.jsx(RoleForm.RoleForm, {
                                            disabled: isFormDisabled,
                                            errors: errors,
                                            values: values,
                                            onChange: handleChange,
                                            onBlur: handleBlur,
                                            role: role
                                        }),
                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                            shadow: "filterShadow",
                                            hasRadius: true,
                                            children: /*#__PURE__*/ jsxRuntime.jsx(Permissions.Permissions, {
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
    const permissions = hooks.useTypedSelector((state)=>state.admin_app.permissions.settings?.roles.update);
    return /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Protect, {
        permissions: permissions,
        children: /*#__PURE__*/ jsxRuntime.jsx(EditPage, {})
    });
};

exports.EditPage = EditPage;
exports.ProtectedEditPage = ProtectedEditPage;
//# sourceMappingURL=EditPage.js.map
