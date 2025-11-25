'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var pick = require('lodash/pick');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var yup = require('yup');
var Form = require('../../../../components/Form.js');
var Renderer = require('../../../../components/FormInputs/Renderer.js');
var Layout = require('../../../../components/Layouts/Layout.js');
var PageHelpers = require('../../../../components/PageHelpers.js');
var hooks = require('../../../../core/store/hooks.js');
var BackButton = require('../../../../features/BackButton.js');
var Notifications = require('../../../../features/Notifications.js');
var useAPIErrorHandler = require('../../../../hooks/useAPIErrorHandler.js');
var useEnterprise = require('../../../../hooks/useEnterprise.js');
var useRBAC = require('../../../../hooks/useRBAC.js');
var selectors = require('../../../../selectors.js');
var users = require('../../../../services/users.js');
var baseQuery = require('../../../../utils/baseQuery.js');
var translatedErrors = require('../../../../utils/translatedErrors.js');
var users$1 = require('../../../../utils/users.js');
var MagicLinkCE = require('./components/MagicLinkCE.js');
var SelectRoles = require('./components/SelectRoles.js');
var validation = require('./utils/validation.js');

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

const EDIT_VALIDATION_SCHEMA = yup__namespace.object().shape({
    ...validation.COMMON_USER_SCHEMA,
    isActive: yup__namespace.bool(),
    roles: yup__namespace.array().min(1, {
        id: translatedErrors.translatedErrors.required.id,
        defaultMessage: 'This field is required'
    }).required({
        id: translatedErrors.translatedErrors.required.id,
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
    const { formatMessage } = reactIntl.useIntl();
    const match = reactRouterDom.useMatch('/settings/users/:id');
    const id = match?.params?.id ?? '';
    const navigate = reactRouterDom.useNavigate();
    const { toggleNotification } = Notifications.useNotification();
    const MagicLink = useEnterprise.useEnterprise(MagicLinkCE.MagicLinkCE, async ()=>(await Promise.resolve().then(function () { return require('../../../../../../ee/admin/src/pages/SettingsPage/pages/Users/components/MagicLinkEE.js'); })).MagicLinkEE);
    const { _unstableFormatAPIError: formatAPIError, _unstableFormatValidationErrors: formatValidationErrors } = useAPIErrorHandler.useAPIErrorHandler();
    const permissions = hooks.useTypedSelector(selectors.selectAdminPermissions);
    const { isLoading: isLoadingRBAC, allowedActions: { canUpdate } } = useRBAC.useRBAC({
        read: permissions.settings?.users.read ?? [],
        update: permissions.settings?.users.update ?? []
    });
    const [updateUser] = users.useUpdateUserMutation();
    const { data, error, isLoading: isLoadingAdminUsers } = users.useAdminUsers({
        id
    }, {
        refetchOnMountOrArgChange: true
    });
    const [user] = data?.users ?? [];
    React__namespace.useEffect(()=>{
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
        return /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Loading, {});
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
        if ('error' in res && baseQuery.isBaseQueryError(res.error)) {
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
    return /*#__PURE__*/ jsxRuntime.jsxs(PageHelpers.Page.Main, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Title, {
                children: formatMessage({
                    id: 'Settings.PageTitle',
                    defaultMessage: 'Settings - {name}'
                }, {
                    name: 'Users'
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(Form.Form, {
                method: "PUT",
                onSubmit: handleSubmit,
                initialValues: initialData,
                validationSchema: EDIT_VALIDATION_SCHEMA,
                children: ({ isSubmitting, modified })=>{
                    return /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(Layout.Layouts.Header, {
                                primaryAction: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                    disabled: isSubmitting || !canUpdate || !modified,
                                    startIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.Check, {}),
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
                                    name: users$1.getDisplayName(initialData)
                                }),
                                navigationAction: /*#__PURE__*/ jsxRuntime.jsx(BackButton.BackButton, {
                                    fallback: "../users"
                                })
                            }),
                            /*#__PURE__*/ jsxRuntime.jsxs(Layout.Layouts.Content, {
                                children: [
                                    user?.registrationToken && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                        paddingBottom: 6,
                                        children: /*#__PURE__*/ jsxRuntime.jsx(MagicLink, {
                                            registrationToken: user.registrationToken
                                        })
                                    }),
                                    /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                        direction: "column",
                                        alignItems: "stretch",
                                        gap: 7,
                                        children: [
                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
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
                                                                id: 'app.components.Users.ModalCreateBody.block-title.details',
                                                                defaultMessage: 'Details'
                                                            })
                                                        }),
                                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Root, {
                                                            gap: 5,
                                                            children: LAYOUT.map((row)=>row.map(({ size, label, ...field })=>{
                                                                    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                                                                        col: size,
                                                                        direction: "column",
                                                                        alignItems: "stretch",
                                                                        children: /*#__PURE__*/ jsxRuntime.jsx(Renderer.InputRenderer, {
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
                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
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
                                                                id: 'global.roles',
                                                                defaultMessage: "User's role"
                                                            })
                                                        }),
                                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Root, {
                                                            gap: 5,
                                                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                                                                col: 6,
                                                                xs: 12,
                                                                direction: "column",
                                                                alignItems: "stretch",
                                                                children: /*#__PURE__*/ jsxRuntime.jsx(SelectRoles.SelectRoles, {
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
    const permissions = hooks.useTypedSelector((state)=>state.admin_app.permissions.settings?.users.read);
    return /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Protect, {
        permissions: permissions,
        children: /*#__PURE__*/ jsxRuntime.jsx(EditPage, {})
    });
};

exports.EditPage = EditPage;
exports.ProtectedEditPage = ProtectedEditPage;
//# sourceMappingURL=EditPage.js.map
