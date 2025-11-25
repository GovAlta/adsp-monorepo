import { jsx, jsxs } from 'react/jsx-runtime';
import { Main, Box, Typography, Flex, Button, Link } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { useNavigate, NavLink } from 'react-router-dom';
import * as yup from 'yup';
import { Form } from '../../../components/Form.mjs';
import { InputRenderer as MemoizedInputRenderer } from '../../../components/FormInputs/Renderer.mjs';
import { Logo } from '../../../components/UnauthenticatedLogo.mjs';
import { useAPIErrorHandler } from '../../../hooks/useAPIErrorHandler.mjs';
import { UnauthenticatedLayout, LayoutContent, Column } from '../../../layouts/UnauthenticatedLayout.mjs';
import { useForgotPasswordMutation } from '../../../services/auth.mjs';
import { isBaseQueryError } from '../../../utils/baseQuery.mjs';
import { translatedErrors as errorsTrads } from '../../../utils/translatedErrors.mjs';

const ForgotPassword = ()=>{
    const navigate = useNavigate();
    const { formatMessage } = useIntl();
    const { _unstableFormatAPIError: formatAPIError } = useAPIErrorHandler();
    const [forgotPassword, { error }] = useForgotPasswordMutation();
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
                                            id: 'Auth.form.button.password-recovery',
                                            defaultMessage: 'Password Recovery'
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
                                email: ''
                            },
                            onSubmit: async (body)=>{
                                const res = await forgotPassword(body);
                                if (!('error' in res)) {
                                    navigate('/auth/forgot-password-success');
                                }
                            },
                            validationSchema: yup.object().shape({
                                email: yup.string().email(errorsTrads.email).required({
                                    id: errorsTrads.required.id,
                                    defaultMessage: 'This field is required.'
                                }).nullable()
                            }),
                            children: /*#__PURE__*/ jsxs(Flex, {
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
                                    ].map((field)=>/*#__PURE__*/ jsx(MemoizedInputRenderer, {
                                            ...field
                                        }, field.name)),
                                    /*#__PURE__*/ jsx(Button, {
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

export { ForgotPassword };
//# sourceMappingURL=ForgotPassword.mjs.map
