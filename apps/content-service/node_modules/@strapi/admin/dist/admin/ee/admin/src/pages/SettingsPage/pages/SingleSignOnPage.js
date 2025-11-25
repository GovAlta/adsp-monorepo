'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var yup = require('yup');
var Form = require('../../../../../../admin/src/components/Form.js');
var Renderer = require('../../../../../../admin/src/components/FormInputs/Renderer.js');
var GradientBadge = require('../../../../../../admin/src/components/GradientBadge.js');
var Layout = require('../../../../../../admin/src/components/Layouts/Layout.js');
var PageHelpers = require('../../../../../../admin/src/components/PageHelpers.js');
var hooks = require('../../../../../../admin/src/core/store/hooks.js');
var Notifications = require('../../../../../../admin/src/features/Notifications.js');
var useAdminRoles = require('../../../../../../admin/src/hooks/useAdminRoles.js');
var useAPIErrorHandler = require('../../../../../../admin/src/hooks/useAPIErrorHandler.js');
var useRBAC = require('../../../../../../admin/src/hooks/useRBAC.js');
var auth = require('../../../../../../admin/src/services/auth.js');
var baseQuery = require('../../../../../../admin/src/utils/baseQuery.js');
var translatedErrors = require('../../../../../../admin/src/utils/translatedErrors.js');

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

var yup__namespace = /*#__PURE__*/_interopNamespaceDefault(yup);

const SCHEMA = yup__namespace.object().shape({
    autoRegister: yup__namespace.bool().required(translatedErrors.translatedErrors.required),
    defaultRole: yup__namespace.mixed().when('autoRegister', (value, initSchema)=>{
        return value ? initSchema.required(translatedErrors.translatedErrors.required) : initSchema.nullable();
    }),
    ssoLockedRoles: yup__namespace.array().nullable().of(yup__namespace.mixed().when('ssoLockedRoles', (value, initSchema)=>{
        return value ? initSchema.required(translatedErrors.translatedErrors.required) : initSchema.nullable();
    }))
});
const SingleSignOnPage = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    const permissions = hooks.useTypedSelector((state)=>state.admin_app.permissions);
    const { toggleNotification } = Notifications.useNotification();
    const { _unstableFormatAPIError: formatAPIError, _unstableFormatValidationErrors: formatValidationErrors } = useAPIErrorHandler.useAPIErrorHandler();
    const { isLoading: isLoadingProviderOptions, data } = auth.useGetProviderOptionsQuery();
    const [updateProviderOptions, { isLoading: isSubmittingForm }] = auth.useUpdateProviderOptionsMutation();
    const { isLoading: isLoadingPermissions, allowedActions: { canUpdate, canRead: canReadRoles } } = useRBAC.useRBAC({
        ...permissions.settings?.sso,
        readRoles: permissions.settings?.roles.read ?? []
    });
    const { roles, isLoading: isLoadingRoles } = useAdminRoles.useAdminRoles(undefined, {
        skip: !canReadRoles
    });
    const handleSubmit = async (body, helpers)=>{
        try {
            const res = await updateProviderOptions(body);
            if ('error' in res) {
                if (baseQuery.isBaseQueryError(res.error) && res.error.name === 'ValidationError') {
                    helpers.setErrors(formatValidationErrors(res.error));
                } else {
                    toggleNotification({
                        type: 'danger',
                        message: formatAPIError(res.error)
                    });
                }
                return;
            }
            toggleNotification({
                type: 'success',
                message: formatMessage({
                    id: 'notification.success.saved'
                })
            });
        } catch (err) {
            toggleNotification({
                type: 'danger',
                message: formatMessage({
                    id: 'notification.error',
                    defaultMessage: 'An error occurred, please try again.'
                })
            });
        }
    };
    const isLoadingData = isLoadingRoles || isLoadingPermissions || isLoadingProviderOptions;
    return /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Title, {
                children: formatMessage({
                    id: 'Settings.PageTitle',
                    defaultMessage: 'Settings - {name}'
                }, {
                    name: 'SSO'
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Main, {
                "aria-busy": isSubmittingForm || isLoadingData,
                tabIndex: -1,
                children: /*#__PURE__*/ jsxRuntime.jsx(Form.Form, {
                    method: "PUT",
                    onSubmit: handleSubmit,
                    validationSchema: SCHEMA,
                    disabled: !canUpdate,
                    initialValues: data || {
                        autoRegister: false,
                        defaultRole: null,
                        ssoLockedRoles: null
                    },
                    children: ({ modified, isSubmitting })=>/*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
                            children: [
                                /*#__PURE__*/ jsxRuntime.jsx(Layout.Layouts.Header, {
                                    primaryAction: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                        disabled: !modified,
                                        loading: isSubmitting,
                                        startIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.Check, {}),
                                        type: "submit",
                                        children: formatMessage({
                                            id: 'global.save',
                                            defaultMessage: 'Save'
                                        })
                                    }),
                                    title: formatMessage({
                                        id: 'Settings.sso.title',
                                        defaultMessage: 'Single Sign-On'
                                    }),
                                    subtitle: formatMessage({
                                        id: 'Settings.sso.description',
                                        defaultMessage: 'Configure the settings for the Single Sign-On feature.'
                                    }),
                                    secondaryAction: /*#__PURE__*/ jsxRuntime.jsx(GradientBadge.GradientBadge, {
                                        label: formatMessage({
                                            id: 'components.premiumFeature.title',
                                            defaultMessage: 'Premium feature'
                                        })
                                    })
                                }),
                                /*#__PURE__*/ jsxRuntime.jsx(Layout.Layouts.Content, {
                                    children: isSubmitting || isLoadingData ? /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Loading, {}) : /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                        direction: "column",
                                        alignItems: "stretch",
                                        gap: 4,
                                        background: "neutral0",
                                        padding: 6,
                                        shadow: "filterShadow",
                                        hasRadius: true,
                                        children: [
                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                variant: "delta",
                                                tag: "h2",
                                                children: formatMessage({
                                                    id: 'global.settings',
                                                    defaultMessage: 'Settings'
                                                })
                                            }),
                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Root, {
                                                gap: 4,
                                                children: [
                                                    {
                                                        hint: formatMessage({
                                                            id: 'Settings.sso.form.registration.description',
                                                            defaultMessage: 'Create new user on SSO login if no account exists'
                                                        }),
                                                        label: formatMessage({
                                                            id: 'Settings.sso.form.registration.label',
                                                            defaultMessage: 'Auto-registration'
                                                        }),
                                                        name: 'autoRegister',
                                                        size: 6,
                                                        type: 'boolean'
                                                    },
                                                    {
                                                        hint: formatMessage({
                                                            id: 'Settings.sso.form.defaultRole.description',
                                                            defaultMessage: 'It will attach the new authenticated user to the selected role'
                                                        }),
                                                        label: formatMessage({
                                                            id: 'Settings.sso.form.defaultRole.label',
                                                            defaultMessage: 'Default role'
                                                        }),
                                                        name: 'defaultRole',
                                                        options: roles.map(({ id, name })=>({
                                                                label: name,
                                                                value: id.toString()
                                                            })),
                                                        placeholder: formatMessage({
                                                            id: 'components.InputSelect.option.placeholder',
                                                            defaultMessage: 'Choose here'
                                                        }),
                                                        size: 6,
                                                        type: 'enumeration'
                                                    },
                                                    {
                                                        hint: formatMessage({
                                                            id: 'Settings.sso.form.localAuthenticationLock.description',
                                                            defaultMessage: 'Select the roles for which you want to disable the local authentication'
                                                        }),
                                                        label: formatMessage({
                                                            id: 'Settings.sso.form.localAuthenticationLock.label',
                                                            defaultMessage: 'Local authentication lock-out'
                                                        }),
                                                        name: 'ssoLockedRoles',
                                                        options: roles.map(({ id, name })=>({
                                                                label: name,
                                                                value: id.toString()
                                                            })),
                                                        placeholder: formatMessage({
                                                            id: 'components.InputSelect.option.placeholder',
                                                            defaultMessage: 'Choose here'
                                                        }),
                                                        size: 6,
                                                        type: 'multi'
                                                    }
                                                ].map(({ size, ...field })=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                                                        col: size,
                                                        direction: "column",
                                                        alignItems: "stretch",
                                                        children: /*#__PURE__*/ jsxRuntime.jsx(FormInputRenderer, {
                                                            ...field
                                                        })
                                                    }, field.name))
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
const FormInputRenderer = (props)=>{
    switch(props.type){
        case 'multi':
            return /*#__PURE__*/ jsxRuntime.jsx(MultiSelectInput, {
                ...props
            });
        default:
            return /*#__PURE__*/ jsxRuntime.jsx(Renderer.InputRenderer, {
                ...props
            });
    }
};
const MultiSelectInput = ({ hint, label, name, options, ...props })=>{
    const field = Form.useField(name);
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
        name: name,
        hint: hint,
        error: field.error,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                children: label
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.MultiSelect, {
                onChange: (value)=>field.onChange('ssoLockedRoles', value),
                onClear: ()=>field.onChange('ssoLockedRoles', []),
                value: field.value ?? [],
                withTags: true,
                ...props,
                children: options.map(({ label, value })=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.MultiSelectOption, {
                        value: value,
                        children: label
                    }, value))
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Hint, {}),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Error, {})
        ]
    });
};
const ProtectedSSO = ()=>{
    const permissions = hooks.useTypedSelector((state)=>state.admin_app.permissions.settings?.sso?.main);
    return /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Protect, {
        permissions: permissions,
        children: /*#__PURE__*/ jsxRuntime.jsx(SingleSignOnPage, {})
    });
};

exports.ProtectedSSO = ProtectedSSO;
exports.SingleSignOnPage = SingleSignOnPage;
//# sourceMappingURL=SingleSignOnPage.js.map
