import { jsx, jsxs } from 'react/jsx-runtime';
import * as React from 'react';
import { Main, Box, Typography, Flex, Button, Link } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { useNavigate, useLocation, Navigate, NavLink } from 'react-router-dom';
import * as yup from 'yup';
import { Form } from '../../../components/Form.mjs';
import { InputRenderer as MemoizedInputRenderer } from '../../../components/FormInputs/Renderer.mjs';
import { Logo } from '../../../components/UnauthenticatedLogo.mjs';
import { useTypedDispatch } from '../../../core/store/hooks.mjs';
import { useAPIErrorHandler } from '../../../hooks/useAPIErrorHandler.mjs';
import { UnauthenticatedLayout, LayoutContent, Column } from '../../../layouts/UnauthenticatedLayout.mjs';
import { login } from '../../../reducer.mjs';
import { useResetPasswordMutation } from '../../../services/auth.mjs';
import { isBaseQueryError } from '../../../utils/baseQuery.mjs';
import { getByteSize } from '../../../utils/strings.mjs';
import { translatedErrors as errorsTrads } from '../../../utils/translatedErrors.mjs';

const RESET_PASSWORD_SCHEMA = yup.object().shape({
    password: yup.string().min(8, {
        id: errorsTrads.minLength.id,
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
        const byteSize = getByteSize(value);
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
        id: errorsTrads.required.id,
        defaultMessage: 'Password is required'
    }).nullable(),
    confirmPassword: yup.string().required({
        id: errorsTrads.required.id,
        defaultMessage: 'Confirm password is required'
    }).oneOf([
        yup.ref('password'),
        null
    ], {
        id: 'components.Input.error.password.noMatch',
        defaultMessage: 'Passwords must match'
    }).nullable()
});
const ResetPassword = ()=>{
    const { formatMessage } = useIntl();
    const dispatch = useTypedDispatch();
    const navigate = useNavigate();
    const { search: searchString } = useLocation();
    const query = React.useMemo(()=>new URLSearchParams(searchString), [
        searchString
    ]);
    const { _unstableFormatAPIError: formatAPIError } = useAPIErrorHandler();
    const [resetPassword, { error }] = useResetPasswordMutation();
    const handleSubmit = async (body)=>{
        const res = await resetPassword(body);
        if ('data' in res) {
            dispatch(login({
                token: res.data.token
            }));
            navigate('/');
        }
    };
    /**
   * If someone doesn't have a reset password token
   * then they should just be redirected back to the login page.
   */ if (!query.get('code')) {
        return /*#__PURE__*/ jsx(Navigate, {
            to: "/auth/login"
        });
    }
    return /*#__PURE__*/ jsx(UnauthenticatedLayout, {
        children: /*#__PURE__*/ jsxs(Main, {
            children: [
                /*#__PURE__*/ jsxs(LayoutContent, {
                    children: [
                        /*#__PURE__*/ jsxs(Column, {
                            children: [
                                /*#__PURE__*/ jsx(Logo, {}),
                                /*#__PURE__*/ jsx(Box, {
                                    paddingTop: 6,
                                    paddingBottom: 7,
                                    children: /*#__PURE__*/ jsx(Typography, {
                                        tag: "h1",
                                        variant: "alpha",
                                        children: formatMessage({
                                            id: 'global.reset-password',
                                            defaultMessage: 'Reset password'
                                        })
                                    })
                                }),
                                error ? /*#__PURE__*/ jsx(Typography, {
                                    id: "global-form-error",
                                    role: "alert",
                                    tabIndex: -1,
                                    textColor: "danger600",
                                    children: isBaseQueryError(error) ? formatAPIError(error) : formatMessage({
                                        id: 'notification.error',
                                        defaultMessage: 'An error occurred'
                                    })
                                }) : null
                            ]
                        }),
                        /*#__PURE__*/ jsx(Form, {
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
                            children: /*#__PURE__*/ jsxs(Flex, {
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
                                    ].map((field)=>/*#__PURE__*/ jsx(MemoizedInputRenderer, {
                                            ...field
                                        }, field.name)),
                                    /*#__PURE__*/ jsx(Button, {
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
                /*#__PURE__*/ jsx(Flex, {
                    justifyContent: "center",
                    children: /*#__PURE__*/ jsx(Box, {
                        paddingTop: 4,
                        children: /*#__PURE__*/ jsx(Link, {
                            tag: NavLink,
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

export { ResetPassword };
//# sourceMappingURL=ResetPassword.mjs.map
