import { jsx, jsxs } from 'react/jsx-runtime';
import * as React from 'react';
import { Flex, Typography, Grid, Button, Box, Link } from '@strapi/design-system';
import omit from 'lodash/omit';
import { useIntl } from 'react-intl';
import { useNavigate, useLocation, useMatch, Navigate, NavLink } from 'react-router-dom';
import { styled } from 'styled-components';
import * as yup from 'yup';
import { ValidationError } from 'yup';
import { Form } from '../../../components/Form.mjs';
import { InputRenderer as MemoizedInputRenderer } from '../../../components/FormInputs/Renderer.mjs';
import { useNpsSurveySettings } from '../../../components/NpsSurvey.mjs';
import { Logo } from '../../../components/UnauthenticatedLogo.mjs';
import { useTypedDispatch } from '../../../core/store/hooks.mjs';
import { useNotification } from '../../../features/Notifications.mjs';
import { useTracking } from '../../../features/Tracking.mjs';
import { useAPIErrorHandler } from '../../../hooks/useAPIErrorHandler.mjs';
import { UnauthenticatedLayout, LayoutContent } from '../../../layouts/UnauthenticatedLayout.mjs';
import { login } from '../../../reducer.mjs';
import { useGetRegistrationInfoQuery, useRegisterAdminMutation, useRegisterUserMutation } from '../../../services/auth.mjs';
import { isBaseQueryError } from '../../../utils/baseQuery.mjs';
import { getOrCreateDeviceId } from '../../../utils/deviceId.mjs';
import { getByteSize } from '../../../utils/strings.mjs';
import { translatedErrors as errorsTrads } from '../../../utils/translatedErrors.mjs';

const REGISTER_USER_SCHEMA = yup.object().shape({
    firstname: yup.string().trim().required(errorsTrads.required).nullable(),
    lastname: yup.string().nullable(),
    password: yup.string().min(8, {
        id: errorsTrads.minLength.id,
        defaultMessage: 'Password must be at least 8 characters',
        values: {
            min: 8
        }
    }).test('max-bytes', {
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
    }).nullable(),
    registrationToken: yup.string().required({
        id: errorsTrads.required.id,
        defaultMessage: 'Registration token is required'
    })
});
const REGISTER_ADMIN_SCHEMA = yup.object().shape({
    firstname: yup.string().trim().required({
        id: errorsTrads.required.id,
        defaultMessage: 'Firstname is required'
    }).nullable(),
    lastname: yup.string().nullable(),
    password: yup.string().min(8, {
        id: errorsTrads.minLength.id,
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
        id: errorsTrads.required.id,
        defaultMessage: 'Password is required'
    }).nullable(),
    confirmPassword: yup.string().required({
        id: errorsTrads.required.id,
        defaultMessage: 'Confirm password is required'
    }).nullable().oneOf([
        yup.ref('password'),
        null
    ], {
        id: 'components.Input.error.password.noMatch',
        defaultMessage: 'Passwords must match'
    }),
    email: yup.string().email({
        id: errorsTrads.email.id,
        defaultMessage: 'Not a valid email'
    }).strict().lowercase({
        id: errorsTrads.lowercase.id,
        defaultMessage: 'Email must be lowercase'
    }).required({
        id: errorsTrads.required.id,
        defaultMessage: 'Email is required'
    }).nullable()
});
const Register = ({ hasAdmin })=>{
    const { toggleNotification } = useNotification();
    const navigate = useNavigate();
    const [submitCount, setSubmitCount] = React.useState(0);
    const [apiError, setApiError] = React.useState();
    const { trackUsage } = useTracking();
    const { formatMessage } = useIntl();
    const { search: searchString } = useLocation();
    const query = React.useMemo(()=>new URLSearchParams(searchString), [
        searchString
    ]);
    const match = useMatch('/auth/:authType');
    const { _unstableFormatAPIError: formatAPIError, _unstableFormatValidationErrors: formatValidationErrors } = useAPIErrorHandler();
    const { setNpsSurveySettings } = useNpsSurveySettings();
    const registrationToken = query.get('registrationToken');
    const { data: userInfo, error } = useGetRegistrationInfoQuery(registrationToken, {
        skip: !registrationToken
    });
    React.useEffect(()=>{
        if (error) {
            const message = isBaseQueryError(error) ? formatAPIError(error) : error.message ?? '';
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
    const [registerAdmin] = useRegisterAdminMutation();
    const [registerUser] = useRegisterUserMutation();
    const dispatch = useTypedDispatch();
    const handleRegisterAdmin = async ({ news, ...body }, setFormErrors)=>{
        const res = await registerAdmin({
            ...body,
            deviceId: getOrCreateDeviceId()
        });
        if ('data' in res) {
            dispatch(login({
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
            if (isBaseQueryError(res.error)) {
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
            deviceId: getOrCreateDeviceId()
        });
        if ('data' in res) {
            dispatch(login({
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
            if (isBaseQueryError(res.error)) {
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
        return /*#__PURE__*/ jsx(Navigate, {
            to: "/"
        });
    }
    const isAdminRegistration = match.params.authType === 'register-admin';
    const schema = isAdminRegistration ? REGISTER_ADMIN_SCHEMA : REGISTER_USER_SCHEMA;
    return /*#__PURE__*/ jsx(UnauthenticatedLayout, {
        children: /*#__PURE__*/ jsxs(LayoutContent, {
            children: [
                /*#__PURE__*/ jsxs(Flex, {
                    direction: "column",
                    alignItems: "center",
                    gap: 3,
                    children: [
                        /*#__PURE__*/ jsx(Logo, {}),
                        /*#__PURE__*/ jsx(Typography, {
                            tag: "h1",
                            variant: "alpha",
                            textAlign: "center",
                            children: formatMessage({
                                id: 'Auth.form.welcome.title',
                                defaultMessage: 'Welcome to Strapi!'
                            })
                        }),
                        /*#__PURE__*/ jsx(Typography, {
                            variant: "epsilon",
                            textColor: "neutral600",
                            textAlign: "center",
                            children: formatMessage({
                                id: 'Auth.form.register.subtitle',
                                defaultMessage: 'Credentials are only used to authenticate in Strapi. All saved data will be stored in your database.'
                            })
                        }),
                        apiError ? /*#__PURE__*/ jsx(Typography, {
                            id: "global-form-error",
                            role: "alert",
                            tabIndex: -1,
                            textColor: "danger600",
                            children: apiError
                        }) : null
                    ]
                }),
                /*#__PURE__*/ jsx(Form, {
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
                            if (err instanceof ValidationError) {
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
                    children: /*#__PURE__*/ jsxs(Flex, {
                        direction: "column",
                        alignItems: "stretch",
                        gap: 6,
                        marginTop: 7,
                        children: [
                            /*#__PURE__*/ jsx(Grid.Root, {
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
                                            terms: /*#__PURE__*/ jsx(A, {
                                                target: "_blank",
                                                href: "https://strapi.io/terms",
                                                rel: "noreferrer",
                                                children: formatMessage({
                                                    id: 'Auth.privacy-policy-agreement.terms',
                                                    defaultMessage: 'terms'
                                                })
                                            }),
                                            policy: /*#__PURE__*/ jsx(A, {
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
                                ].map(({ size, ...field })=>/*#__PURE__*/ jsx(Grid.Item, {
                                        col: size,
                                        direction: "column",
                                        alignItems: "stretch",
                                        children: /*#__PURE__*/ jsx(MemoizedInputRenderer, {
                                            ...field
                                        })
                                    }, field.name))
                            }),
                            /*#__PURE__*/ jsx(Button, {
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
                match?.params.authType === 'register' && /*#__PURE__*/ jsx(Box, {
                    paddingTop: 4,
                    children: /*#__PURE__*/ jsx(Flex, {
                        justifyContent: "center",
                        children: /*#__PURE__*/ jsx(Link, {
                            tag: NavLink,
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
const A = styled.a`
  color: ${({ theme })=>theme.colors.primary600};
`;

export { Register };
//# sourceMappingURL=Register.mjs.map
