'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var upperFirst = require('lodash/upperFirst');
var reactIntl = require('react-intl');
var yup = require('yup');
var Form = require('../components/Form.js');
var Renderer = require('../components/FormInputs/Renderer.js');
var Context = require('../components/GuidedTour/Context.js');
var Layout = require('../components/Layouts/Layout.js');
var PageHelpers = require('../components/PageHelpers.js');
var hooks = require('../core/store/hooks.js');
var Auth = require('../features/Auth.js');
var Notifications = require('../features/Notifications.js');
var Tracking = require('../features/Tracking.js');
var useAPIErrorHandler = require('../hooks/useAPIErrorHandler.js');
var useMediaQuery = require('../hooks/useMediaQuery.js');
var reducer = require('../reducer.js');
var auth = require('../services/auth.js');
var baseQuery = require('../utils/baseQuery.js');
var translatedErrors = require('../utils/translatedErrors.js');
var users = require('../utils/users.js');
var validation = require('./Settings/pages/Users/utils/validation.js');

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

const PROFILE_VALIDTION_SCHEMA = yup__namespace.object().shape({
    ...validation.COMMON_USER_SCHEMA,
    currentPassword: yup__namespace.string()// @ts-expect-error – no idea why this is failing.
    .when([
        'password',
        'confirmPassword'
    ], (password, confirmPassword, passSchema)=>{
        return password || confirmPassword ? passSchema.required({
            id: translatedErrors.translatedErrors.required.id,
            defaultMessage: 'This field is required'
        }).nullable() : passSchema;
    }),
    preferedLanguage: yup__namespace.string().nullable()
});
/* -------------------------------------------------------------------------------------------------
 * ProfilePage
 * -----------------------------------------------------------------------------------------------*/ const Panel = ({ children, ...flexProps })=>{
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
        background: "neutral0",
        hasRadius: true,
        shadow: "filterShadow",
        paddingTop: 6,
        paddingBottom: 6,
        paddingLeft: 7,
        paddingRight: 7,
        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
            direction: "column",
            alignItems: "stretch",
            gap: 4,
            ...flexProps,
            children: children
        })
    });
};
const ProfilePage = ()=>{
    const isDesktop = useMediaQuery.useIsDesktop();
    const localeNames = hooks.useTypedSelector((state)=>state.admin_app.language.localeNames);
    const { formatMessage } = reactIntl.useIntl();
    const { trackUsage } = Tracking.useTracking();
    const { toggleNotification } = Notifications.useNotification();
    const { notifyStatus } = designSystem.useNotifyAT();
    const currentTheme = hooks.useTypedSelector((state)=>state.admin_app.theme.currentTheme);
    const dispatch = hooks.useTypedDispatch();
    const { _unstableFormatValidationErrors: formatValidationErrors, _unstableFormatAPIError: formatApiError } = useAPIErrorHandler.useAPIErrorHandler();
    const user = Auth.useAuth('ProfilePage', (state)=>state.user);
    React__namespace.useEffect(()=>{
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
    const [updateMe, { isLoading: isSubmittingForm }] = auth.useUpdateMeMutation();
    const { isLoading, data: dataSSO, error } = auth.useIsSSOLockedQuery(undefined, {
        skip: !(window.strapi.isEE && window.strapi.features.isEnabled('sso'))
    });
    React__namespace.useEffect(()=>{
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
            dispatch(reducer.setAppTheme(currentTheme));
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
            if (baseQuery.isBaseQueryError(res.error) && res.error.name === 'ValidationError') {
                setErrors(formatValidationErrors(res.error));
            } else if (baseQuery.isBaseQueryError(res.error)) {
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
        return /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Loading, {});
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
    return /*#__PURE__*/ jsxRuntime.jsx(jsxRuntime.Fragment, {
        children: /*#__PURE__*/ jsxRuntime.jsxs(PageHelpers.Page.Main, {
            "aria-busy": isSubmittingForm,
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Title, {
                    children: formatMessage({
                        id: 'Settings.profile.form.section.head.title',
                        defaultMessage: 'User profile'
                    })
                }),
                /*#__PURE__*/ jsxRuntime.jsx(Form.Form, {
                    method: "PUT",
                    onSubmit: handleSubmit,
                    initialValues: initialData,
                    validationSchema: PROFILE_VALIDTION_SCHEMA,
                    children: ({ isSubmitting, modified })=>/*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
                            children: [
                                /*#__PURE__*/ jsxRuntime.jsx(Layout.Layouts.Header, {
                                    title: users.getDisplayName(user),
                                    primaryAction: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                        startIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.Check, {}),
                                        loading: isSubmitting,
                                        type: "submit",
                                        disabled: !modified,
                                        children: formatMessage({
                                            id: 'global.save',
                                            defaultMessage: 'Save'
                                        })
                                    })
                                }),
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                    paddingBottom: 6,
                                    children: /*#__PURE__*/ jsxRuntime.jsx(Layout.Layouts.Content, {
                                        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                            direction: "column",
                                            alignItems: "stretch",
                                            gap: 6,
                                            children: [
                                                /*#__PURE__*/ jsxRuntime.jsx(UserInfoSection, {}),
                                                !hasLockedRole && /*#__PURE__*/ jsxRuntime.jsx(PasswordSection, {}),
                                                /*#__PURE__*/ jsxRuntime.jsx(PreferencesSection, {
                                                    localeNames: localeNames
                                                })
                                            ]
                                        })
                                    })
                                })
                            ]
                        })
                }),
                isDesktop && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                    children: /*#__PURE__*/ jsxRuntime.jsx(Layout.Layouts.Content, {
                        children: /*#__PURE__*/ jsxRuntime.jsx(GuidedTourSection, {})
                    })
                })
            ]
        })
    });
};
/* -------------------------------------------------------------------------------------------------
 * PasswordSection
 * -----------------------------------------------------------------------------------------------*/ const PasswordSection = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsxs(Panel, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
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
            ].map((row, index)=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Root, {
                    gap: 5,
                    children: row.map(({ size, ...field })=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                            col: size,
                            direction: "column",
                            alignItems: "stretch",
                            children: /*#__PURE__*/ jsxRuntime.jsx(Renderer.InputRenderer, {
                                ...field
                            })
                        }, field.name))
                }, index))
        ]
    });
};
const PreferencesSection = ({ localeNames })=>{
    const { formatMessage } = reactIntl.useIntl();
    const themesToDisplay = hooks.useTypedSelector((state)=>state.admin_app.theme.availableThemes);
    return /*#__PURE__*/ jsxRuntime.jsxs(Panel, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                direction: "column",
                alignItems: "stretch",
                gap: 1,
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                        variant: "delta",
                        tag: "h2",
                        children: formatMessage({
                            id: 'Settings.profile.form.section.experience.title',
                            defaultMessage: 'Experience'
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                        children: formatMessage({
                            id: 'Settings.profile.form.section.experience.interfaceLanguageHelp',
                            defaultMessage: 'Preference changes will apply only to you. More information is available {here}.'
                        }, {
                            here: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
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
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Root, {
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
                ].map(({ size, ...field })=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                        col: size,
                        direction: "column",
                        alignItems: "stretch",
                        children: /*#__PURE__*/ jsxRuntime.jsx(Renderer.InputRenderer, {
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
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsxs(Panel, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                variant: "delta",
                tag: "h2",
                children: formatMessage({
                    id: 'global.profile',
                    defaultMessage: 'Profile'
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Root, {
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
                ].map(({ size, ...field })=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                        col: size,
                        direction: "column",
                        alignItems: "stretch",
                        children: /*#__PURE__*/ jsxRuntime.jsx(Renderer.InputRenderer, {
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
    const { formatMessage } = reactIntl.useIntl();
    const { toggleNotification } = Notifications.useNotification();
    const dispatch = Context.useGuidedTour('ProfilePage', (s)=>s.dispatch);
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
    return /*#__PURE__*/ jsxRuntime.jsxs(Panel, {
        alignItems: "start",
        children: [
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                direction: "column",
                alignItems: "start",
                gap: 1,
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                        variant: "delta",
                        tag: "h2",
                        children: formatMessage({
                            id: 'tours.profile.title',
                            defaultMessage: 'Guided tour'
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                        variant: "pi",
                        children: formatMessage({
                            id: 'tours.profile.description',
                            defaultMessage: 'You can reset the guided tour at any time.'
                        })
                    })
                ]
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
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

exports.ProfilePage = ProfilePage;
//# sourceMappingURL=ProfilePage.js.map
