'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var omit = require('lodash/omit');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var styled = require('styled-components');
var yup = require('yup');
var Form = require('../../../components/Form.js');
var Renderer = require('../../../components/FormInputs/Renderer.js');
var NpsSurvey = require('../../../components/NpsSurvey.js');
var UnauthenticatedLogo = require('../../../components/UnauthenticatedLogo.js');
var hooks = require('../../../core/store/hooks.js');
var Notifications = require('../../../features/Notifications.js');
var Tracking = require('../../../features/Tracking.js');
var useAPIErrorHandler = require('../../../hooks/useAPIErrorHandler.js');
var UnauthenticatedLayout = require('../../../layouts/UnauthenticatedLayout.js');
var reducer = require('../../../reducer.js');
var auth = require('../../../services/auth.js');
var baseQuery = require('../../../utils/baseQuery.js');
var deviceId = require('../../../utils/deviceId.js');
var strings = require('../../../utils/strings.js');
var translatedErrors = require('../../../utils/translatedErrors.js');

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

const REGISTER_USER_SCHEMA = yup__namespace.object().shape({
    firstname: yup__namespace.string().trim().required(translatedErrors.translatedErrors.required).nullable(),
    lastname: yup__namespace.string().nullable(),
    password: yup__namespace.string().min(8, {
        id: translatedErrors.translatedErrors.minLength.id,
        defaultMessage: 'Password must be at least 8 characters',
        values: {
            min: 8
        }
    }).test('max-bytes', {
        id: 'components.Input.error.contain.maxBytes',
        defaultMessage: 'Password must be less than 73 bytes'
    }, function(value) {
        if (!value || typeof value !== 'string') return true; // validated elsewhere
        const byteSize = strings.getByteSize(value);
        return byteSize <= 72;
    }).matches(/[a-z]/, {
        message: {
            id: 'components.Input.error.contain.lowercase',
            defaultMessage: 'Password must contain at least 1 lowercase letter'
        }
    }).matches(/[A-Z]/, {
        message: {
            id: 'components.Input.error.contain.uppercase',
            defaultMessage: 'Password must contain at least 1 uppercase letter'
        }
    }).matches(/\d/, {
        message: {
            id: 'components.Input.error.contain.number',
            defaultMessage: 'Password must contain at least 1 number'
        }
    }).required({
        id: translatedErrors.translatedErrors.required.id,
        defaultMessage: 'Password is required'
    }).nullable(),
    confirmPassword: yup__namespace.string().required({
        id: translatedErrors.translatedErrors.required.id,
        defaultMessage: 'Confirm password is required'
    }).oneOf([
        yup__namespace.ref('password'),
        null
    ], {
        id: 'components.Input.error.password.noMatch',
        defaultMessage: 'Passwords must match'
    }).nullable(),
    registrationToken: yup__namespace.string().required({
        id: translatedErrors.translatedErrors.required.id,
        defaultMessage: 'Registration token is required'
    })
});
const REGISTER_ADMIN_SCHEMA = yup__namespace.object().shape({
    firstname: yup__namespace.string().trim().required({
        id: translatedErrors.translatedErrors.required.id,
        defaultMessage: 'Firstname is required'
    }).nullable(),
    lastname: yup__namespace.string().nullable(),
    password: yup__namespace.string().min(8, {
        id: translatedErrors.translatedErrors.minLength.id,
        defaultMessage: 'Password must be at least 8 characters',
        values: {
            min: 8
        }
    }).test('max-bytes', {
        id: 'components.Input.error.contain.maxBytes',
        defaultMessage: 'Password must be less than 73 bytes'
    }, function(value) {
        if (!value) return true;
        return new TextEncoder().encode(value).length <= 72;
    }).matches(/[a-z]/, {
        message: {
            id: 'components.Input.error.contain.lowercase',
            defaultMessage: 'Password must contain at least 1 lowercase letter'
        }
    }).matches(/[A-Z]/, {
        message: {
            id: 'components.Input.error.contain.uppercase',
            defaultMessage: 'Password must contain at least 1 uppercase letter'
        }
    }).matches(/\d/, {
        message: {
            id: 'components.Input.error.contain.number',
            defaultMessage: 'Password must contain at least 1 number'
        }
    }).required({
        id: translatedErrors.translatedErrors.required.id,
        defaultMessage: 'Password is required'
    }).nullable(),
    confirmPassword: yup__namespace.string().required({
        id: translatedErrors.translatedErrors.required.id,
        defaultMessage: 'Confirm password is required'
    }).nullable().oneOf([
        yup__namespace.ref('password'),
        null
    ], {
        id: 'components.Input.error.password.noMatch',
        defaultMessage: 'Passwords must match'
    }),
    email: yup__namespace.string().email({
        id: translatedErrors.translatedErrors.email.id,
        defaultMessage: 'Not a valid email'
    }).strict().lowercase({
        id: translatedErrors.translatedErrors.lowercase.id,
        defaultMessage: 'Email must be lowercase'
    }).required({
        id: translatedErrors.translatedErrors.required.id,
        defaultMessage: 'Email is required'
    }).nullable()
});
const Register = ({ hasAdmin })=>{
    const { toggleNotification } = Notifications.useNotification();
    const navigate = reactRouterDom.useNavigate();
    const [submitCount, setSubmitCount] = React__namespace.useState(0);
    const [apiError, setApiError] = React__namespace.useState();
    const { trackUsage } = Tracking.useTracking();
    const { formatMessage } = reactIntl.useIntl();
    const { search: searchString } = reactRouterDom.useLocation();
    const query = React__namespace.useMemo(()=>new URLSearchParams(searchString), [
        searchString
    ]);
    const match = reactRouterDom.useMatch('/auth/:authType');
    const { _unstableFormatAPIError: formatAPIError, _unstableFormatValidationErrors: formatValidationErrors } = useAPIErrorHandler.useAPIErrorHandler();
    const { setNpsSurveySettings } = NpsSurvey.useNpsSurveySettings();
    const registrationToken = query.get('registrationToken');
    const { data: userInfo, error } = auth.useGetRegistrationInfoQuery(registrationToken, {
        skip: !registrationToken
    });
    React__namespace.useEffect(()=>{
        if (error) {
            const message = baseQuery.isBaseQueryError(error) ? formatAPIError(error) : error.message ?? '';
            toggleNotification({
                type: 'danger',
                message
            });
            navigate(`/auth/oops?info=${encodeURIComponent(message)}`);
        }
    }, [
        error,
        formatAPIError,
        navigate,
        toggleNotification
    ]);
    const [registerAdmin] = auth.useRegisterAdminMutation();
    const [registerUser] = auth.useRegisterUserMutation();
    const dispatch = hooks.useTypedDispatch();
    const handleRegisterAdmin = async ({ news, ...body }, setFormErrors)=>{
        const res = await registerAdmin({
            ...body,
            deviceId: deviceId.getOrCreateDeviceId()
        });
        if ('data' in res) {
            dispatch(reducer.login({
                token: res.data.token
            }));
            if (news) {
                // Only enable EE survey if user accepted the newsletter
                setNpsSurveySettings((s)=>({
                        ...s,
                        enabled: true
                    }));
                navigate({
                    pathname: '/usecase',
                    search: `?hasAdmin=${true}`
                });
            } else {
                navigate('/');
            }
        } else {
            if (baseQuery.isBaseQueryError(res.error)) {
                trackUsage('didNotCreateFirstAdmin');
                if (res.error.name === 'ValidationError') {
                    setFormErrors(formatValidationErrors(res.error));
                    return;
                }
                setApiError(formatAPIError(res.error));
            }
        }
    };
    const handleRegisterUser = async ({ news, ...body }, setFormErrors)=>{
        const res = await registerUser({
            ...body,
            deviceId: deviceId.getOrCreateDeviceId()
        });
        if ('data' in res) {
            dispatch(reducer.login({
                token: res.data.token
            }));
            if (news) {
                // Only enable EE survey if user accepted the newsletter
                setNpsSurveySettings((s)=>({
                        ...s,
                        enabled: true
                    }));
                navigate({
                    pathname: '/usecase',
                    search: `?hasAdmin=${hasAdmin}`
                });
            } else {
                navigate('/');
            }
        } else {
            if (baseQuery.isBaseQueryError(res.error)) {
                trackUsage('didNotCreateFirstAdmin');
                if (res.error.name === 'ValidationError') {
                    setFormErrors(formatValidationErrors(res.error));
                    return;
                }
                setApiError(formatAPIError(res.error));
            }
        }
    };
    if (!match || match.params.authType !== 'register' && match.params.authType !== 'register-admin') {
        return /*#__PURE__*/ jsxRuntime.jsx(reactRouterDom.Navigate, {
            to: "/"
        });
    }
    const isAdminRegistration = match.params.authType === 'register-admin';
    const schema = isAdminRegistration ? REGISTER_ADMIN_SCHEMA : REGISTER_USER_SCHEMA;
    return /*#__PURE__*/ jsxRuntime.jsx(UnauthenticatedLayout.UnauthenticatedLayout, {
        children: /*#__PURE__*/ jsxRuntime.jsxs(UnauthenticatedLayout.LayoutContent, {
            children: [
                /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                    direction: "column",
                    alignItems: "center",
                    gap: 3,
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(UnauthenticatedLogo.Logo, {}),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                            tag: "h1",
                            variant: "alpha",
                            textAlign: "center",
                            children: formatMessage({
                                id: 'Auth.form.welcome.title',
                                defaultMessage: 'Welcome to Strapi!'
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                            variant: "epsilon",
                            textColor: "neutral600",
                            textAlign: "center",
                            children: formatMessage({
                                id: 'Auth.form.register.subtitle',
                                defaultMessage: 'Credentials are only used to authenticate in Strapi. All saved data will be stored in your database.'
                            })
                        }),
                        apiError ? /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                            id: "global-form-error",
                            role: "alert",
                            tabIndex: -1,
                            textColor: "danger600",
                            children: apiError
                        }) : null
                    ]
                }),
                /*#__PURE__*/ jsxRuntime.jsx(Form.Form, {
                    method: "POST",
                    initialValues: {
                        firstname: userInfo?.firstname || '',
                        lastname: userInfo?.lastname || '',
                        email: userInfo?.email || '',
                        password: '',
                        confirmPassword: '',
                        registrationToken: registrationToken || undefined,
                        news: false
                    },
                    onSubmit: async (data, helpers)=>{
                        const normalizedData = normalizeData(data);
                        try {
                            await schema.validate(normalizedData, {
                                abortEarly: false
                            });
                            if (submitCount > 0 && isAdminRegistration) {
                                trackUsage('didSubmitWithErrorsFirstAdmin', {
                                    count: submitCount.toString()
                                });
                            }
                            if (normalizedData.registrationToken) {
                                handleRegisterUser({
                                    userInfo: omit(normalizedData, [
                                        'registrationToken',
                                        'confirmPassword',
                                        'email',
                                        'news'
                                    ]),
                                    registrationToken: normalizedData.registrationToken,
                                    news: normalizedData.news
                                }, helpers.setErrors);
                            } else {
                                await handleRegisterAdmin(omit(normalizedData, [
                                    'registrationToken',
                                    'confirmPassword'
                                ]), helpers.setErrors);
                            }
                        } catch (err) {
                            if (err instanceof yup.ValidationError) {
                                helpers.setErrors(err.inner.reduce((acc, { message, path })=>{
                                    if (path && typeof message === 'object') {
                                        acc[path] = formatMessage(message);
                                    }
                                    return acc;
                                }, {}));
                            }
                            setSubmitCount(submitCount + 1);
                        }
                    },
                    children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                        direction: "column",
                        alignItems: "stretch",
                        gap: 6,
                        marginTop: 7,
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Root, {
                                gap: 4,
                                children: [
                                    {
                                        label: formatMessage({
                                            id: 'Auth.form.firstname.label',
                                            defaultMessage: 'Firstname'
                                        }),
                                        name: 'firstname',
                                        required: true,
                                        size: 6,
                                        type: 'string'
                                    },
                                    {
                                        label: formatMessage({
                                            id: 'Auth.form.lastname.label',
                                            defaultMessage: 'Lastname'
                                        }),
                                        name: 'lastname',
                                        size: 6,
                                        type: 'string'
                                    },
                                    {
                                        disabled: !isAdminRegistration,
                                        label: formatMessage({
                                            id: 'Auth.form.email.label',
                                            defaultMessage: 'Email'
                                        }),
                                        name: 'email',
                                        required: true,
                                        size: 12,
                                        type: 'email'
                                    },
                                    {
                                        hint: formatMessage({
                                            id: 'Auth.form.password.hint',
                                            defaultMessage: 'Must be at least 8 characters, 1 uppercase, 1 lowercase & 1 number'
                                        }),
                                        label: formatMessage({
                                            id: 'global.password',
                                            defaultMessage: 'Password'
                                        }),
                                        name: 'password',
                                        required: true,
                                        size: 12,
                                        type: 'password'
                                    },
                                    {
                                        label: formatMessage({
                                            id: 'Auth.form.confirmPassword.label',
                                            defaultMessage: 'Confirm Password'
                                        }),
                                        name: 'confirmPassword',
                                        required: true,
                                        size: 12,
                                        type: 'password'
                                    },
                                    {
                                        label: formatMessage({
                                            id: 'Auth.form.register.news.label',
                                            defaultMessage: 'Keep me updated about new features & upcoming improvements (by doing this you accept the {terms} and the {policy}).'
                                        }, {
                                            terms: /*#__PURE__*/ jsxRuntime.jsx(A, {
                                                target: "_blank",
                                                href: "https://strapi.io/terms",
                                                rel: "noreferrer",
                                                children: formatMessage({
                                                    id: 'Auth.privacy-policy-agreement.terms',
                                                    defaultMessage: 'terms'
                                                })
                                            }),
                                            policy: /*#__PURE__*/ jsxRuntime.jsx(A, {
                                                target: "_blank",
                                                href: "https://strapi.io/privacy",
                                                rel: "noreferrer",
                                                children: formatMessage({
                                                    id: 'Auth.privacy-policy-agreement.policy',
                                                    defaultMessage: 'policy'
                                                })
                                            })
                                        }),
                                        name: 'news',
                                        size: 12,
                                        type: 'checkbox'
                                    }
                                ].map(({ size, ...field })=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                                        col: size,
                                        direction: "column",
                                        alignItems: "stretch",
                                        children: /*#__PURE__*/ jsxRuntime.jsx(Renderer.InputRenderer, {
                                            ...field
                                        })
                                    }, field.name))
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                fullWidth: true,
                                size: "L",
                                type: "submit",
                                children: formatMessage({
                                    id: 'Auth.form.button.register',
                                    defaultMessage: "Let's start"
                                })
                            })
                        ]
                    })
                }),
                match?.params.authType === 'register' && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                    paddingTop: 4,
                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                        justifyContent: "center",
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Link, {
                            tag: reactRouterDom.NavLink,
                            to: "/auth/login",
                            children: formatMessage({
                                id: 'Auth.link.signin.account',
                                defaultMessage: 'Already have an account?'
                            })
                        })
                    })
                })
            ]
        })
    });
};
/**
 * @description Trims all values but the password & sets lastName to null if it's a falsey value.
 */ function normalizeData(data) {
    return Object.entries(data).reduce((acc, [key, value])=>{
        if (![
            'password',
            'confirmPassword'
        ].includes(key) && typeof value === 'string') {
            acc[key] = value.trim();
            if (key === 'lastname') {
                acc[key] = value || undefined;
            }
        } else {
            acc[key] = value;
        }
        return acc;
    }, {});
}
const A = styled.styled.a`
  color: ${({ theme })=>theme.colors.primary600};
`;

exports.Register = Register;
//# sourceMappingURL=Register.js.map
