'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var yup = require('yup');
var Form = require('../../../components/Form.js');
var Renderer = require('../../../components/FormInputs/Renderer.js');
var UnauthenticatedLogo = require('../../../components/UnauthenticatedLogo.js');
var useAPIErrorHandler = require('../../../hooks/useAPIErrorHandler.js');
var UnauthenticatedLayout = require('../../../layouts/UnauthenticatedLayout.js');
var auth = require('../../../services/auth.js');
var baseQuery = require('../../../utils/baseQuery.js');
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

var yup__namespace = /*#__PURE__*/_interopNamespaceDefault(yup);

const ForgotPassword = ()=>{
    const navigate = reactRouterDom.useNavigate();
    const { formatMessage } = reactIntl.useIntl();
    const { _unstableFormatAPIError: formatAPIError } = useAPIErrorHandler.useAPIErrorHandler();
    const [forgotPassword, { error }] = auth.useForgotPasswordMutation();
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
                                            id: 'Auth.form.button.password-recovery',
                                            defaultMessage: 'Password Recovery'
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
                                email: ''
                            },
                            onSubmit: async (body)=>{
                                const res = await forgotPassword(body);
                                if (!('error' in res)) {
                                    navigate('/auth/forgot-password-success');
                                }
                            },
                            validationSchema: yup__namespace.object().shape({
                                email: yup__namespace.string().email(translatedErrors.translatedErrors.email).required({
                                    id: translatedErrors.translatedErrors.required.id,
                                    defaultMessage: 'This field is required.'
                                }).nullable()
                            }),
                            children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                direction: "column",
                                alignItems: "stretch",
                                gap: 6,
                                children: [
                                    [
                                        {
                                            label: formatMessage({
                                                id: 'Auth.form.email.label',
                                                defaultMessage: 'Email'
                                            }),
                                            name: 'email',
                                            placeholder: formatMessage({
                                                id: 'Auth.form.email.placeholder',
                                                defaultMessage: 'kai@doe.com'
                                            }),
                                            required: true,
                                            type: 'string'
                                        }
                                    ].map((field)=>/*#__PURE__*/ jsxRuntime.jsx(Renderer.InputRenderer, {
                                            ...field
                                        }, field.name)),
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                        type: "submit",
                                        fullWidth: true,
                                        children: formatMessage({
                                            id: 'Auth.form.button.forgot-password',
                                            defaultMessage: 'Send Email'
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

exports.ForgotPassword = ForgotPassword;
//# sourceMappingURL=ForgotPassword.js.map
