import { jsx, jsxs } from 'react/jsx-runtime';
import * as React from 'react';
import { Main, Flex, Box, Typography, Field, SingleSelect, SingleSelectOption, TextInput, Button, TextButton } from '@strapi/design-system';
import { parse } from 'qs';
import { useIntl } from 'react-intl';
import { useLocation, useNavigate } from 'react-router-dom';
import { PrivateRoute } from '../components/PrivateRoute.mjs';
import { Logo } from '../components/UnauthenticatedLogo.mjs';
import { useAuth } from '../features/Auth.mjs';
import { useNotification } from '../features/Notifications.mjs';
import { UnauthenticatedLayout, LayoutContent } from '../layouts/UnauthenticatedLayout.mjs';

const options = [
    {
        intlLabel: {
            id: 'Usecase.front-end',
            defaultMessage: 'Front-end developer'
        },
        value: 'front_end_developer'
    },
    {
        intlLabel: {
            id: 'Usecase.back-end',
            defaultMessage: 'Back-end developer'
        },
        value: 'back_end_developer'
    },
    {
        intlLabel: {
            id: 'Usecase.full-stack',
            defaultMessage: 'Full-stack developer'
        },
        value: 'full_stack_developer'
    },
    {
        intlLabel: {
            id: 'global.content-manager',
            defaultMessage: 'Content Manager'
        },
        value: 'content_manager'
    },
    {
        intlLabel: {
            id: 'Usecase.content-creator',
            defaultMessage: 'Content Creator'
        },
        value: 'content_creator'
    },
    {
        intlLabel: {
            id: 'Usecase.other',
            defaultMessage: 'Other'
        },
        value: 'other'
    }
];
const UseCasePage = ()=>{
    const { toggleNotification } = useNotification();
    const location = useLocation();
    const navigate = useNavigate();
    const { formatMessage } = useIntl();
    const [role, setRole] = React.useState(null);
    const [otherRole, setOtherRole] = React.useState('');
    const { firstname, email } = useAuth('UseCasePage', (state)=>state.user) ?? {};
    const { hasAdmin } = parse(location.search, {
        ignoreQueryPrefix: true
    });
    const isOther = role === 'other';
    const handleSubmit = async (event, skipPersona)=>{
        event.preventDefault();
        try {
            await fetch(`${process.env.STRAPI_ANALYTICS_URL || 'https://analytics.strapi.io'}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    username: firstname,
                    firstAdmin: Boolean(!hasAdmin),
                    persona: {
                        role: skipPersona ? undefined : role,
                        otherRole: skipPersona ? undefined : otherRole
                    }
                })
            });
            toggleNotification({
                type: 'success',
                message: formatMessage({
                    id: 'Usecase.notification.success.project-created',
                    defaultMessage: 'Project has been successfully created'
                })
            });
            navigate('/');
        } catch (err) {
        // Silent
        }
    };
    return /*#__PURE__*/ jsx(UnauthenticatedLayout, {
        children: /*#__PURE__*/ jsxs(Main, {
            labelledBy: "usecase-title",
            children: [
                /*#__PURE__*/ jsx(LayoutContent, {
                    children: /*#__PURE__*/ jsxs("form", {
                        onSubmit: (e)=>handleSubmit(e, false),
                        children: [
                            /*#__PURE__*/ jsxs(Flex, {
                                direction: "column",
                                paddingBottom: 7,
                                children: [
                                    /*#__PURE__*/ jsx(Logo, {}),
                                    /*#__PURE__*/ jsx(Box, {
                                        paddingTop: 6,
                                        paddingBottom: 1,
                                        width: `25rem`,
                                        children: /*#__PURE__*/ jsx(Typography, {
                                            textAlign: "center",
                                            variant: "alpha",
                                            tag: "h1",
                                            id: "usecase-title",
                                            children: formatMessage({
                                                id: 'Usecase.title',
                                                defaultMessage: 'Tell us a bit more about yourself'
                                            })
                                        })
                                    })
                                ]
                            }),
                            /*#__PURE__*/ jsxs(Flex, {
                                direction: "column",
                                alignItems: "stretch",
                                gap: 6,
                                children: [
                                    /*#__PURE__*/ jsxs(Field.Root, {
                                        name: "usecase",
                                        children: [
                                            /*#__PURE__*/ jsx(Field.Label, {
                                                children: formatMessage({
                                                    id: 'Usecase.input.work-type',
                                                    defaultMessage: 'What type of work do you do?'
                                                })
                                            }),
                                            /*#__PURE__*/ jsx(SingleSelect, {
                                                onChange: (value)=>setRole(value),
                                                value: role,
                                                children: options.map(({ intlLabel, value })=>/*#__PURE__*/ jsx(SingleSelectOption, {
                                                        value: value,
                                                        children: formatMessage(intlLabel)
                                                    }, value))
                                            })
                                        ]
                                    }),
                                    isOther && /*#__PURE__*/ jsxs(Field.Root, {
                                        name: "other",
                                        children: [
                                            /*#__PURE__*/ jsx(Field.Label, {
                                                children: formatMessage({
                                                    id: 'Usecase.other',
                                                    defaultMessage: 'Other'
                                                })
                                            }),
                                            /*#__PURE__*/ jsx(TextInput, {
                                                value: otherRole,
                                                onChange: (e)=>setOtherRole(e.target.value)
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ jsx(Button, {
                                        type: "submit",
                                        size: "L",
                                        fullWidth: true,
                                        disabled: !role,
                                        children: formatMessage({
                                            id: 'global.finish',
                                            defaultMessage: 'Finish'
                                        })
                                    })
                                ]
                            })
                        ]
                    })
                }),
                /*#__PURE__*/ jsx(Flex, {
                    justifyContent: "center",
                    children: /*#__PURE__*/ jsx(Box, {
                        paddingTop: 4,
                        children: /*#__PURE__*/ jsx(TextButton, {
                            onClick: (event)=>handleSubmit(event, true),
                            children: formatMessage({
                                id: 'Usecase.button.skip',
                                defaultMessage: 'Skip this question'
                            })
                        })
                    })
                })
            ]
        })
    });
};
const PrivateUseCasePage = ()=>{
    return /*#__PURE__*/ jsx(PrivateRoute, {
        children: /*#__PURE__*/ jsx(UseCasePage, {})
    });
};

export { PrivateUseCasePage, UseCasePage, options };
//# sourceMappingURL=UseCasePage.mjs.map
