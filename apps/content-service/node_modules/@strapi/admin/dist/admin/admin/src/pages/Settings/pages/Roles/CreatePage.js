'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var dateFns = require('date-fns');
var formik = require('formik');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var styled = require('styled-components');
var yup = require('yup');
var Layout = require('../../../../components/Layouts/Layout.js');
var PageHelpers = require('../../../../components/PageHelpers.js');
var hooks = require('../../../../core/store/hooks.js');
var BackButton = require('../../../../features/BackButton.js');
var Notifications = require('../../../../features/Notifications.js');
var Tracking = require('../../../../features/Tracking.js');
var useAPIErrorHandler = require('../../../../hooks/useAPIErrorHandler.js');
var users = require('../../../../services/users.js');
var baseQuery = require('../../../../utils/baseQuery.js');
var translatedErrors = require('../../../../utils/translatedErrors.js');
var Permissions = require('./components/Permissions.js');

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

/* -------------------------------------------------------------------------------------------------
 * CreatePage
 * -----------------------------------------------------------------------------------------------*/ const CREATE_SCHEMA = yup__namespace.object().shape({
    name: yup__namespace.string().required(translatedErrors.translatedErrors.required.id),
    description: yup__namespace.string().required(translatedErrors.translatedErrors.required.id)
});
/**
 * TODO: this whole section of the app needs refactoring. Using a ref to
 * manage the state of the child is nonsensical.
 */ const CreatePage = ()=>{
    const { id } = reactRouterDom.useParams();
    const { toggleNotification } = Notifications.useNotification();
    const { formatMessage } = reactIntl.useIntl();
    const navigate = reactRouterDom.useNavigate();
    const permissionsRef = React__namespace.useRef(null);
    const { trackUsage } = Tracking.useTracking();
    const { _unstableFormatAPIError: formatAPIError, _unstableFormatValidationErrors: formatValidationErrors } = useAPIErrorHandler.useAPIErrorHandler();
    const { isLoading: isLoadingPermissionsLayout, currentData: permissionsLayout } = users.useGetRolePermissionLayoutQuery({
        /**
       * Role here is a query param so if there's no role we pass an empty string
       * which returns us a default layout.
       */ role: id ?? ''
    });
    /**
   * We need this so if we're cloning a role, we can fetch
   * the current permissions that role has.
   */ const { currentData: rolePermissions, isLoading: isLoadingRole } = users.useGetRolePermissionsQuery({
        id: id
    }, {
        skip: !id,
        refetchOnMountOrArgChange: true
    });
    const [createRole] = users.useCreateRoleMutation();
    const [updateRolePermissions] = users.useUpdateRolePermissionsMutation();
    const handleCreateRoleSubmit = async (data, formik)=>{
        try {
            if (id) {
                trackUsage('willDuplicateRole');
            } else {
                trackUsage('willCreateNewRole');
            }
            const res = await createRole(data);
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
            const { permissionsToSend } = permissionsRef.current?.getPermissions() ?? {};
            if (res.data.id && Array.isArray(permissionsToSend) && permissionsToSend.length > 0) {
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
                initialValues: {
                    name: '',
                    description: `${formatMessage({
                        id: 'Settings.roles.form.created',
                        defaultMessage: 'Created'
                    })} ${dateFns.format(new Date(), 'PPP')}`
                },
                onSubmit: handleCreateRoleSubmit,
                validationSchema: CREATE_SCHEMA,
                validateOnChange: false,
                children: ({ values, errors, handleReset, handleChange, isSubmitting })=>/*#__PURE__*/ jsxRuntime.jsx(formik.Form, {
                        children: /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
                            children: [
                                /*#__PURE__*/ jsxRuntime.jsx(Layout.Layouts.Header, {
                                    primaryAction: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                        gap: 2,
                                        children: [
                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
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
                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                                type: "submit",
                                                loading: isSubmitting,
                                                startIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.Check, {}),
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
                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
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
                                                                                children: formatMessage({
                                                                                    id: 'global.details',
                                                                                    defaultMessage: 'Details'
                                                                                })
                                                                            })
                                                                        }),
                                                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                                                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
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
                                                                /*#__PURE__*/ jsxRuntime.jsx(UsersRoleNumber, {
                                                                    children: formatMessage({
                                                                        id: 'Settings.roles.form.button.users-with-role',
                                                                        defaultMessage: '{number, plural, =0 {# users} one {# user} other {# users}} with this role'
                                                                    }, {
                                                                        number: 0
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
                                                                                onChange: handleChange,
                                                                                value: values.name
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
                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                                shadow: "filterShadow",
                                                hasRadius: true,
                                                children: /*#__PURE__*/ jsxRuntime.jsx(Permissions.Permissions, {
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
const UsersRoleNumber = styled.styled.div`
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
    const permissions = hooks.useTypedSelector((state)=>state.admin_app.permissions.settings?.roles.create);
    return /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Protect, {
        permissions: permissions,
        children: /*#__PURE__*/ jsxRuntime.jsx(CreatePage, {})
    });
};

exports.CreatePage = CreatePage;
exports.ProtectedCreatePage = ProtectedCreatePage;
//# sourceMappingURL=CreatePage.js.map
