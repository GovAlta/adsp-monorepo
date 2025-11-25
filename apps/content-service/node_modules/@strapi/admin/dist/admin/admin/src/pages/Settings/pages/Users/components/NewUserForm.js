'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var yup = require('yup');
var Form = require('../../../../../components/Form.js');
var Renderer = require('../../../../../components/FormInputs/Renderer.js');
var Notifications = require('../../../../../features/Notifications.js');
var useAPIErrorHandler = require('../../../../../hooks/useAPIErrorHandler.js');
var useEnterprise = require('../../../../../hooks/useEnterprise.js');
var users = require('../../../../../services/users.js');
var baseQuery = require('../../../../../utils/baseQuery.js');
var translatedErrors = require('../../../../../utils/translatedErrors.js');
var MagicLinkCE = require('./MagicLinkCE.js');
var SelectRoles = require('./SelectRoles.js');

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

const ModalForm = ({ onToggle })=>{
    const [currentStep, setStep] = React__namespace.useState('create');
    const [registrationToken, setRegistrationToken] = React__namespace.useState('');
    const { formatMessage } = reactIntl.useIntl();
    const { toggleNotification } = Notifications.useNotification();
    const { _unstableFormatAPIError: formatAPIError, _unstableFormatValidationErrors: formatValidationErrors } = useAPIErrorHandler.useAPIErrorHandler();
    const roleLayout = useEnterprise.useEnterprise(ROLE_LAYOUT, async ()=>(await Promise.resolve().then(function () { return require('../../../../../../../ee/admin/src/pages/SettingsPage/pages/Users/components/ModalForm.js'); })).ROLE_LAYOUT, {
        combine (ceRoles, eeRoles) {
            return [
                ...ceRoles,
                ...eeRoles
            ];
        },
        defaultValue: []
    });
    const initialValues = useEnterprise.useEnterprise(FORM_INITIAL_VALUES, async ()=>(await Promise.resolve().then(function () { return require('../../../../../../../ee/admin/src/pages/SettingsPage/pages/Users/components/ModalForm.js'); })).FORM_INITIAL_VALUES, {
        combine (ceValues, eeValues) {
            return {
                ...ceValues,
                ...eeValues
            };
        },
        defaultValue: FORM_INITIAL_VALUES
    });
    const MagicLink = useEnterprise.useEnterprise(MagicLinkCE.MagicLinkCE, async ()=>(await Promise.resolve().then(function () { return require('../../../../../../../ee/admin/src/pages/SettingsPage/pages/Users/components/MagicLinkEE.js'); })).MagicLinkEE);
    const [createUser] = users.useCreateUserMutation();
    const headerTitle = formatMessage({
        id: 'Settings.permissions.users.create',
        defaultMessage: 'Invite new user'
    });
    const handleSubmit = async (body, { setErrors })=>{
        const res = await createUser({
            ...body,
            roles: body.roles ?? []
        });
        if ('data' in res) {
            // NOTE: when enabling SSO, the user doesn't have to register and the token is undefined
            if (res.data.registrationToken) {
                setRegistrationToken(res.data.registrationToken);
            }
            goNext();
        } else {
            toggleNotification({
                type: 'danger',
                message: formatAPIError(res.error)
            });
            if (baseQuery.isBaseQueryError(res.error) && res.error.name === 'ValidationError') {
                setErrors(formatValidationErrors(res.error));
            }
        }
    };
    const goNext = ()=>{
        if (next) {
            setStep(next);
        } else {
            onToggle();
        }
    };
    const { buttonSubmitLabel, isDisabled, next } = STEPPER[currentStep];
    // block rendering until the EE component is fully loaded
    if (!MagicLink) {
        return null;
    }
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Root, {
        defaultOpen: true,
        onOpenChange: onToggle,
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Modal.Content, {
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Header, {
                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Breadcrumbs, {
                        label: headerTitle,
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Crumb, {
                            isCurrent: true,
                            children: headerTitle
                        })
                    })
                }),
                /*#__PURE__*/ jsxRuntime.jsx(Form.Form, {
                    method: currentStep === 'create' ? 'POST' : 'PUT',
                    initialValues: initialValues ?? {},
                    onSubmit: handleSubmit,
                    validationSchema: FORM_SCHEMA,
                    children: ({ isSubmitting })=>{
                        return /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
                            children: [
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Body, {
                                    children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                        direction: "column",
                                        alignItems: "stretch",
                                        gap: 6,
                                        children: [
                                            currentStep !== 'create' && /*#__PURE__*/ jsxRuntime.jsx(MagicLink, {
                                                registrationToken: registrationToken
                                            }),
                                            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Box, {
                                                children: [
                                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                        variant: "beta",
                                                        tag: "h2",
                                                        children: formatMessage({
                                                            id: 'app.components.Users.ModalCreateBody.block-title.details',
                                                            defaultMessage: 'User details'
                                                        })
                                                    }),
                                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                                        paddingTop: 4,
                                                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                                                            direction: "column",
                                                            alignItems: "stretch",
                                                            gap: 1,
                                                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Root, {
                                                                gap: 5,
                                                                children: FORM_LAYOUT.map((row)=>{
                                                                    return row.map(({ size, ...field })=>{
                                                                        return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                                                                            col: size,
                                                                            direction: "column",
                                                                            alignItems: "stretch",
                                                                            children: /*#__PURE__*/ jsxRuntime.jsx(Renderer.InputRenderer, {
                                                                                ...field,
                                                                                disabled: isDisabled,
                                                                                label: formatMessage(field.label),
                                                                                placeholder: formatMessage(field.placeholder)
                                                                            })
                                                                        }, field.name);
                                                                    });
                                                                })
                                                            })
                                                        })
                                                    })
                                                ]
                                            }),
                                            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Box, {
                                                children: [
                                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                        variant: "beta",
                                                        tag: "h2",
                                                        children: formatMessage({
                                                            id: 'global.roles',
                                                            defaultMessage: "User's role"
                                                        })
                                                    }),
                                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                                        paddingTop: 4,
                                                        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Grid.Root, {
                                                            gap: 5,
                                                            children: [
                                                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                                                                    col: 6,
                                                                    xs: 12,
                                                                    direction: "column",
                                                                    alignItems: "stretch",
                                                                    children: /*#__PURE__*/ jsxRuntime.jsx(SelectRoles.SelectRoles, {
                                                                        disabled: isDisabled
                                                                    })
                                                                }),
                                                                roleLayout.map((row)=>{
                                                                    return row.map(({ size, ...field })=>{
                                                                        return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                                                                            col: size,
                                                                            direction: "column",
                                                                            alignItems: "stretch",
                                                                            children: /*#__PURE__*/ jsxRuntime.jsx(Renderer.InputRenderer, {
                                                                                ...field,
                                                                                disabled: isDisabled,
                                                                                label: formatMessage(field.label),
                                                                                placeholder: field.placeholder ? formatMessage(field.placeholder) : undefined,
                                                                                hint: field.hint ? formatMessage(field.hint) : undefined
                                                                            })
                                                                        }, field.name);
                                                                    });
                                                                })
                                                            ]
                                                        })
                                                    })
                                                ]
                                            })
                                        ]
                                    })
                                }),
                                /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Modal.Footer, {
                                    children: [
                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                            variant: "tertiary",
                                            onClick: onToggle,
                                            type: "button",
                                            children: formatMessage({
                                                id: 'app.components.Button.cancel',
                                                defaultMessage: 'Cancel'
                                            })
                                        }),
                                        currentStep === 'create' ? /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                            type: "submit",
                                            loading: isSubmitting,
                                            children: formatMessage(buttonSubmitLabel)
                                        }) : /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                            type: "button",
                                            loading: isSubmitting,
                                            onClick: onToggle,
                                            children: formatMessage(buttonSubmitLabel)
                                        })
                                    ]
                                })
                            ]
                        });
                    }
                })
            ]
        })
    });
};
const FORM_INITIAL_VALUES = {
    firstname: '',
    lastname: '',
    email: '',
    roles: []
};
const ROLE_LAYOUT = [];
const FORM_LAYOUT = [
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
        }
    ]
];
const FORM_SCHEMA = yup__namespace.object().shape({
    firstname: yup__namespace.string().trim().required({
        id: translatedErrors.translatedErrors.required.id,
        defaultMessage: 'This field is required'
    }).nullable(),
    lastname: yup__namespace.string(),
    email: yup__namespace.string().email(translatedErrors.translatedErrors.email).required({
        id: translatedErrors.translatedErrors.required.id,
        defaultMessage: 'This field is required'
    }).nullable(),
    roles: yup__namespace.array().min(1, {
        id: translatedErrors.translatedErrors.required.id,
        defaultMessage: 'This field is required'
    }).required({
        id: translatedErrors.translatedErrors.required.id,
        defaultMessage: 'This field is required'
    })
});
const STEPPER = {
    create: {
        buttonSubmitLabel: {
            id: 'app.containers.Users.ModalForm.footer.button-success',
            defaultMessage: 'Invite user'
        },
        isDisabled: false,
        next: 'magic-link'
    },
    'magic-link': {
        buttonSubmitLabel: {
            id: 'global.finish',
            defaultMessage: 'Finish'
        },
        isDisabled: true,
        next: null
    }
};

exports.ModalForm = ModalForm;
//# sourceMappingURL=NewUserForm.js.map
