'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var yup = require('yup');
var Form = require('../../../components/Form.js');
var Renderer = require('../../../components/FormInputs/Renderer.js');
var UnauthenticatedLogo = require('../../../components/UnauthenticatedLogo.js');
var hooks = require('../../../core/store/hooks.js');
var useAPIErrorHandler = require('../../../hooks/useAPIErrorHandler.js');
var UnauthenticatedLayout = require('../../../layouts/UnauthenticatedLayout.js');
var reducer = require('../../../reducer.js');
var auth = require('../../../services/auth.js');
var baseQuery = require('../../../utils/baseQuery.js');
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

const RESET_PASSWORD_SCHEMA = yup__namespace.object().shape({
    password: yup__namespace.string().min(8, {
        id: translatedErrors.translatedErrors.minLength.id,
        defaultMessage: 'Password must be at least 8 characters',
        values: {
            min: 8
        }
    })// bcrypt has a max length of 72 bytes (not characters!)
    .test('required-byte-size', {
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
    }).nullable()
});
const ResetPassword = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    const dispatch = hooks.useTypedDispatch();
    const navigate = reactRouterDom.useNavigate();
    const { search: searchString } = reactRouterDom.useLocation();
    const query = React__namespace.useMemo(()=>new URLSearchParams(searchString), [
        searchString
    ]);
    const { _unstableFormatAPIError: formatAPIError } = useAPIErrorHandler.useAPIErrorHandler();
    const [resetPassword, { error }] = auth.useResetPasswordMutation();
    const handleSubmit = async (body)=>{
        const res = await resetPassword(body);
        if ('data' in res) {
            dispatch(reducer.login({
                token: res.data.token
            }));
            navigate('/');
        }
    };
    /**
   * If someone doesn't have a reset password token
   * then they should just be redirected back to the login page.
   */ if (!query.get('code')) {
        return /*#__PURE__*/ jsxRuntime.jsx(reactRouterDom.Navigate, {
            to: "/auth/login"
        });
    }
    return /*#__PURE__*/ jsxRuntime.jsx(UnauthenticatedLayout.UnauthenticatedLayout, {
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Main, {
            children: [
                /*#__PURE__*/ jsxRuntime.jsxs(UnauthenticatedLayout.LayoutContent, {
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsxs(UnauthenticatedLayout.Column, {
                            children: [
                                /*#__PURE__*/ jsxRuntime.jsx(UnauthenticatedLogo.Logo, {}),
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                    paddingTop: 6,
                                    paddingBottom: 7,
                                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                        tag: "h1",
                                        variant: "alpha",
                                        children: formatMessage({
                                            id: 'global.reset-password',
                                            defaultMessage: 'Reset password'
                                        })
                                    })
                                }),
                                error ? /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                    id: "global-form-error",
                                    role: "alert",
                                    tabIndex: -1,
                                    textColor: "danger600",
                                    children: baseQuery.isBaseQueryError(error) ? formatAPIError(error) : formatMessage({
                                        id: 'notification.error',
                                        defaultMessage: 'An error occurred'
                                    })
                                }) : null
                            ]
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(Form.Form, {
                            method: "POST",
                            initialValues: {
                                password: '',
                                confirmPassword: ''
                            },
                            onSubmit: (values)=>{
                                // We know query.code is defined because we check for it above.
                                handleSubmit({
                                    password: values.password,
                                    resetPasswordToken: query.get('code')
                                });
                            },
                            validationSchema: RESET_PASSWORD_SCHEMA,
                            children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                direction: "column",
                                alignItems: "stretch",
                                gap: 6,
                                children: [
                                    [
                                        {
                                            hint: formatMessage({
                                                id: 'Auth.form.password.hint',
                                                defaultMessage: 'Password must contain at least 8 characters, 1 uppercase, 1 lowercase and 1 number'
                                            }),
                                            label: formatMessage({
                                                id: 'global.password',
                                                defaultMessage: 'Password'
                                            }),
                                            name: 'password',
                                            required: true,
                                            type: 'password'
                                        },
                                        {
                                            label: formatMessage({
                                                id: 'Auth.form.confirmPassword.label',
                                                defaultMessage: 'Confirm Password'
                                            }),
                                            name: 'confirmPassword',
                                            required: true,
                                            type: 'password'
                                        }
                                    ].map((field)=>/*#__PURE__*/ jsxRuntime.jsx(Renderer.InputRenderer, {
                                            ...field
                                        }, field.name)),
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                        fullWidth: true,
                                        type: "submit",
                                        children: formatMessage({
                                            id: 'global.change-password',
                                            defaultMessage: 'Change password'
                                        })
                                    })
                                ]
                            })
                        })
                    ]
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                    justifyContent: "center",
                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                        paddingTop: 4,
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Link, {
                            tag: reactRouterDom.NavLink,
                            to: "/auth/login",
                            children: formatMessage({
                                id: 'Auth.link.ready',
                                defaultMessage: 'Ready to sign in?'
                            })
                        })
                    })
                })
            ]
        })
    });
};

exports.ResetPassword = ResetPassword;
//# sourceMappingURL=ResetPassword.js.map
