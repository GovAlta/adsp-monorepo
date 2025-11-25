import { jsx, Fragment, jsxs } from 'react/jsx-runtime';
import * as React from 'react';
import { useNotifyAT, Button, Box, Flex, Typography, Grid } from '@strapi/design-system';
import { Check } from '@strapi/icons';
import upperFirst from 'lodash/upperFirst';
import { useIntl } from 'react-intl';
import * as yup from 'yup';
import { Form } from '../components/Form.mjs';
import { InputRenderer as MemoizedInputRenderer } from '../components/FormInputs/Renderer.mjs';
import { useGuidedTour } from '../components/GuidedTour/Context.mjs';
import { Layouts } from '../components/Layouts/Layout.mjs';
import { Page } from '../components/PageHelpers.mjs';
import { useTypedSelector, useTypedDispatch } from '../core/store/hooks.mjs';
import { useAuth } from '../features/Auth.mjs';
import { useNotification } from '../features/Notifications.mjs';
import { useTracking } from '../features/Tracking.mjs';
import { useAPIErrorHandler } from '../hooks/useAPIErrorHandler.mjs';
import { useIsDesktop } from '../hooks/useMediaQuery.mjs';
import { setAppTheme } from '../reducer.mjs';
import { useUpdateMeMutation, useIsSSOLockedQuery } from '../services/auth.mjs';
import { isBaseQueryError } from '../utils/baseQuery.mjs';
import { translatedErrors as errorsTrads } from '../utils/translatedErrors.mjs';
import { getDisplayName } from '../utils/users.mjs';
import { COMMON_USER_SCHEMA } from './Settings/pages/Users/utils/validation.mjs';

const PROFILE_VALIDTION_SCHEMA = yup.object().shape({
    ...COMMON_USER_SCHEMA,
    currentPassword: yup.string()// @ts-expect-error – no idea why this is failing.
    .when([
        'password',
        'confirmPassword'
    ], (password, confirmPassword, passSchema)=>{
        return password || confirmPassword ? passSchema.required({
            id: errorsTrads.required.id,
            defaultMessage: 'This field is required'
        }).nullable() : passSchema;
    }),
    preferedLanguage: yup.string().nullable()
});
/* -------------------------------------------------------------------------------------------------
 * ProfilePage
 * -----------------------------------------------------------------------------------------------*/ const Panel = ({ children, ...flexProps })=>{
    return /*#__PURE__*/ jsx(Box, {
        background: "neutral0",
        hasRadius: true,
        shadow: "filterShadow",
        paddingTop: 6,
        paddingBottom: 6,
        paddingLeft: 7,
        paddingRight: 7,
        children: /*#__PURE__*/ jsx(Flex, {
            direction: "column",
            alignItems: "stretch",
            gap: 4,
            ...flexProps,
            children: children
        })
    });
};
const ProfilePage = ()=>{
    const isDesktop = useIsDesktop();
    const localeNames = useTypedSelector((state)=>state.admin_app.language.localeNames);
    const { formatMessage } = useIntl();
    const { trackUsage } = useTracking();
    const { toggleNotification } = useNotification();
    const { notifyStatus } = useNotifyAT();
    const currentTheme = useTypedSelector((state)=>state.admin_app.theme.currentTheme);
    const dispatch = useTypedDispatch();
    const { _unstableFormatValidationErrors: formatValidationErrors, _unstableFormatAPIError: formatApiError } = useAPIErrorHandler();
    const user = useAuth('ProfilePage', (state)=>state.user);
    React.useEffect(()=>{
        if (user) {
            notifyStatus(formatMessage({
                id: 'Settings.profile.form.notify.data.loaded',
                defaultMessage: 'Your profile data has been loaded'
            }));
        } else {
            toggleNotification({
                type: 'danger',
                message: formatMessage({
                    id: 'notification.error',
                    defaultMessage: 'An error occured'
                })
            });
        }
    }, [
        formatMessage,
        notifyStatus,
        toggleNotification,
        user
    ]);
    const [updateMe, { isLoading: isSubmittingForm }] = useUpdateMeMutation();
    const { isLoading, data: dataSSO, error } = useIsSSOLockedQuery(undefined, {
        skip: !(window.strapi.isEE && window.strapi.features.isEnabled('sso'))
    });
    React.useEffect(()=>{
        if (error) {
            toggleNotification({
                type: 'danger',
                message: formatMessage({
                    id: 'Settings.permissions.users.sso.provider.error'
                })
            });
        }
    }, [
        error,
        formatMessage,
        toggleNotification
    ]);
    const handleSubmit = async (body, { setErrors })=>{
        const { confirmPassword: _confirmPassword, currentTheme, ...bodyRest } = body;
        let dataToSend = bodyRest;
        // The password fields are optional. If the user didn't touch them, don't send any password
        // to the API, because an empty string would throw a validation error
        if (dataToSend.password === '') {
            const { password: _password, currentPassword: _currentPassword, ...passwordRequestBodyRest } = dataToSend;
            dataToSend = passwordRequestBodyRest;
        }
        const res = await updateMe(dataToSend);
        if ('data' in res) {
            dispatch(setAppTheme(currentTheme));
            trackUsage('didChangeMode', {
                newMode: currentTheme
            });
            toggleNotification({
                type: 'success',
                message: formatMessage({
                    id: 'notification.success.saved',
                    defaultMessage: 'Saved'
                })
            });
        }
        if ('error' in res) {
            if (isBaseQueryError(res.error) && res.error.name === 'ValidationError') {
                setErrors(formatValidationErrors(res.error));
            } else if (isBaseQueryError(res.error)) {
                toggleNotification({
                    type: 'danger',
                    message: formatApiError(res.error)
                });
            } else {
                toggleNotification({
                    type: 'danger',
                    message: formatMessage({
                        id: 'notification.error',
                        defaultMessage: 'An error occured'
                    })
                });
            }
        }
    };
    if (isLoading) {
        return /*#__PURE__*/ jsx(Page.Loading, {});
    }
    const hasLockedRole = dataSSO?.isSSOLocked ?? false;
    const { email, firstname, lastname, username, preferedLanguage } = user ?? {};
    const initialData = {
        email: email ?? '',
        firstname: firstname ?? '',
        lastname: lastname ?? '',
        username: username ?? '',
        preferedLanguage,
        currentTheme,
        confirmPassword: '',
        password: ''
    };
    return /*#__PURE__*/ jsx(Fragment, {
        children: /*#__PURE__*/ jsxs(Page.Main, {
            "aria-busy": isSubmittingForm,
            children: [
                /*#__PURE__*/ jsx(Page.Title, {
                    children: formatMessage({
                        id: 'Settings.profile.form.section.head.title',
                        defaultMessage: 'User profile'
                    })
                }),
                /*#__PURE__*/ jsx(Form, {
                    method: "PUT",
                    onSubmit: handleSubmit,
                    initialValues: initialData,
                    validationSchema: PROFILE_VALIDTION_SCHEMA,
                    children: ({ isSubmitting, modified })=>/*#__PURE__*/ jsxs(Fragment, {
                            children: [
                                /*#__PURE__*/ jsx(Layouts.Header, {
                                    title: getDisplayName(user),
                                    primaryAction: /*#__PURE__*/ jsx(Button, {
                                        startIcon: /*#__PURE__*/ jsx(Check, {}),
                                        loading: isSubmitting,
                                        type: "submit",
                                        disabled: !modified,
                                        children: formatMessage({
                                            id: 'global.save',
                                            defaultMessage: 'Save'
                                        })
                                    })
                                }),
                                /*#__PURE__*/ jsx(Box, {
                                    paddingBottom: 6,
                                    children: /*#__PURE__*/ jsx(Layouts.Content, {
                                        children: /*#__PURE__*/ jsxs(Flex, {
                                            direction: "column",
                                            alignItems: "stretch",
                                            gap: 6,
                                            children: [
                                                /*#__PURE__*/ jsx(UserInfoSection, {}),
                                                !hasLockedRole && /*#__PURE__*/ jsx(PasswordSection, {}),
                                                /*#__PURE__*/ jsx(PreferencesSection, {
                                                    localeNames: localeNames
                                                })
                                            ]
                                        })
                                    })
                                })
                            ]
                        })
                }),
                isDesktop && /*#__PURE__*/ jsx(Box, {
                    children: /*#__PURE__*/ jsx(Layouts.Content, {
                        children: /*#__PURE__*/ jsx(GuidedTourSection, {})
                    })
                })
            ]
        })
    });
};
/* -------------------------------------------------------------------------------------------------
 * PasswordSection
 * -----------------------------------------------------------------------------------------------*/ const PasswordSection = ()=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsxs(Panel, {
        children: [
            /*#__PURE__*/ jsx(Typography, {
                variant: "delta",
                tag: "h2",
                children: formatMessage({
                    id: 'global.change-password',
                    defaultMessage: 'Change password'
                })
            }),
            [
                [
                    {
                        label: formatMessage({
                            id: 'Auth.form.currentPassword.label',
                            defaultMessage: 'Current Password'
                        }),
                        name: 'currentPassword',
                        size: 6,
                        type: 'password'
                    }
                ],
                [
                    {
                        autoComplete: 'new-password',
                        label: formatMessage({
                            id: 'global.password',
                            defaultMessage: 'Password'
                        }),
                        name: 'password',
                        size: 6,
                        type: 'password'
                    },
                    {
                        autoComplete: 'new-password',
                        label: formatMessage({
                            id: 'Auth.form.confirmPassword.label',
                            defaultMessage: 'Confirm Password'
                        }),
                        name: 'confirmPassword',
                        size: 6,
                        type: 'password'
                    }
                ]
            ].map((row, index)=>/*#__PURE__*/ jsx(Grid.Root, {
                    gap: 5,
                    children: row.map(({ size, ...field })=>/*#__PURE__*/ jsx(Grid.Item, {
                            col: size,
                            direction: "column",
                            alignItems: "stretch",
                            children: /*#__PURE__*/ jsx(MemoizedInputRenderer, {
                                ...field
                            })
                        }, field.name))
                }, index))
        ]
    });
};
const PreferencesSection = ({ localeNames })=>{
    const { formatMessage } = useIntl();
    const themesToDisplay = useTypedSelector((state)=>state.admin_app.theme.availableThemes);
    return /*#__PURE__*/ jsxs(Panel, {
        children: [
            /*#__PURE__*/ jsxs(Flex, {
                direction: "column",
                alignItems: "stretch",
                gap: 1,
                children: [
                    /*#__PURE__*/ jsx(Typography, {
                        variant: "delta",
                        tag: "h2",
                        children: formatMessage({
                            id: 'Settings.profile.form.section.experience.title',
                            defaultMessage: 'Experience'
                        })
                    }),
                    /*#__PURE__*/ jsx(Typography, {
                        children: formatMessage({
                            id: 'Settings.profile.form.section.experience.interfaceLanguageHelp',
                            defaultMessage: 'Preference changes will apply only to you. More information is available {here}.'
                        }, {
                            here: /*#__PURE__*/ jsx(Box, {
                                tag: "a",
                                color: "primary600",
                                target: "_blank",
                                rel: "noopener noreferrer",
                                href: "https://docs.strapi.io/developer-docs/latest/development/admin-customization.html#locales",
                                children: formatMessage({
                                    id: 'Settings.profile.form.section.experience.here',
                                    defaultMessage: 'here'
                                })
                            })
                        })
                    })
                ]
            }),
            /*#__PURE__*/ jsx(Grid.Root, {
                gap: 5,
                children: [
                    {
                        hint: formatMessage({
                            id: 'Settings.profile.form.section.experience.interfaceLanguage.hint',
                            defaultMessage: 'This will only display your own interface in the chosen language.'
                        }),
                        label: formatMessage({
                            id: 'Settings.profile.form.section.experience.interfaceLanguage',
                            defaultMessage: 'Interface language'
                        }),
                        name: 'preferedLanguage',
                        options: Object.entries(localeNames).map(([value, label])=>({
                                label,
                                value
                            })),
                        placeholder: formatMessage({
                            id: 'global.select',
                            defaultMessage: 'Select'
                        }),
                        size: 6,
                        type: 'enumeration'
                    },
                    {
                        hint: formatMessage({
                            id: 'Settings.profile.form.section.experience.mode.hint',
                            defaultMessage: 'Displays your interface in the chosen mode.'
                        }),
                        label: formatMessage({
                            id: 'Settings.profile.form.section.experience.mode.label',
                            defaultMessage: 'Interface mode'
                        }),
                        name: 'currentTheme',
                        options: [
                            {
                                label: formatMessage({
                                    id: 'Settings.profile.form.section.experience.mode.option-system-label',
                                    defaultMessage: 'Use system settings'
                                }),
                                value: 'system'
                            },
                            ...themesToDisplay.map((theme)=>({
                                    label: formatMessage({
                                        id: 'Settings.profile.form.section.experience.mode.option-label',
                                        defaultMessage: '{name} mode'
                                    }, {
                                        name: formatMessage({
                                            id: theme,
                                            defaultMessage: upperFirst(theme)
                                        })
                                    }),
                                    value: theme
                                }))
                        ],
                        placeholder: formatMessage({
                            id: 'components.Select.placeholder',
                            defaultMessage: 'Select'
                        }),
                        size: 6,
                        type: 'enumeration'
                    }
                ].map(({ size, ...field })=>/*#__PURE__*/ jsx(Grid.Item, {
                        col: size,
                        direction: "column",
                        alignItems: "stretch",
                        children: /*#__PURE__*/ jsx(MemoizedInputRenderer, {
                            ...field
                        })
                    }, field.name))
            })
        ]
    });
};
/* -------------------------------------------------------------------------------------------------
 * UserInfoSection
 * -----------------------------------------------------------------------------------------------*/ const UserInfoSection = ()=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsxs(Panel, {
        children: [
            /*#__PURE__*/ jsx(Typography, {
                variant: "delta",
                tag: "h2",
                children: formatMessage({
                    id: 'global.profile',
                    defaultMessage: 'Profile'
                })
            }),
            /*#__PURE__*/ jsx(Grid.Root, {
                gap: 5,
                children: [
                    {
                        label: formatMessage({
                            id: 'Auth.form.firstname.label',
                            defaultMessage: 'First name'
                        }),
                        name: 'firstname',
                        required: true,
                        size: 6,
                        type: 'string'
                    },
                    {
                        label: formatMessage({
                            id: 'Auth.form.lastname.label',
                            defaultMessage: 'Last name'
                        }),
                        name: 'lastname',
                        size: 6,
                        type: 'string'
                    },
                    {
                        label: formatMessage({
                            id: 'Auth.form.email.label',
                            defaultMessage: 'Email'
                        }),
                        name: 'email',
                        required: true,
                        size: 6,
                        type: 'email'
                    },
                    {
                        label: formatMessage({
                            id: 'Auth.form.username.label',
                            defaultMessage: 'Username'
                        }),
                        name: 'username',
                        size: 6,
                        type: 'string'
                    }
                ].map(({ size, ...field })=>/*#__PURE__*/ jsx(Grid.Item, {
                        col: size,
                        direction: "column",
                        alignItems: "stretch",
                        children: /*#__PURE__*/ jsx(MemoizedInputRenderer, {
                            ...field
                        })
                    }, field.name))
            })
        ]
    });
};
/* -------------------------------------------------------------------------------------------------
 * GuidedTourSection
 * -----------------------------------------------------------------------------------------------*/ const GuidedTourSection = ()=>{
    const { formatMessage } = useIntl();
    const { toggleNotification } = useNotification();
    const dispatch = useGuidedTour('ProfilePage', (s)=>s.dispatch);
    const onClickReset = ()=>{
        dispatch({
            type: 'reset_all_tours'
        });
        toggleNotification({
            type: 'success',
            message: formatMessage({
                id: 'tours.profile.notification.success.reset',
                defaultMessage: 'Guided tour reset'
            })
        });
    };
    return /*#__PURE__*/ jsxs(Panel, {
        alignItems: "start",
        children: [
            /*#__PURE__*/ jsxs(Flex, {
                direction: "column",
                alignItems: "start",
                gap: 1,
                children: [
                    /*#__PURE__*/ jsx(Typography, {
                        variant: "delta",
                        tag: "h2",
                        children: formatMessage({
                            id: 'tours.profile.title',
                            defaultMessage: 'Guided tour'
                        })
                    }),
                    /*#__PURE__*/ jsx(Typography, {
                        variant: "pi",
                        children: formatMessage({
                            id: 'tours.profile.description',
                            defaultMessage: 'You can reset the guided tour at any time.'
                        })
                    })
                ]
            }),
            /*#__PURE__*/ jsx(Button, {
                variant: "tertiary",
                onClick: onClickReset,
                children: formatMessage({
                    id: 'tours.profile.reset',
                    defaultMessage: 'Reset guided tour'
                })
            })
        ]
    });
};

export { ProfilePage };
//# sourceMappingURL=ProfilePage.mjs.map
