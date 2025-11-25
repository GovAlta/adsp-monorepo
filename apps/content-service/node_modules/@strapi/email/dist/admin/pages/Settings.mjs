import { jsx, jsxs } from 'react/jsx-runtime';
import * as React from 'react';
import { Page, useNotification, useFetchClient, Layouts } from '@strapi/admin/strapi-admin';
import { Flex, Box, Typography, Grid, Field, TextInput, SingleSelect, SingleSelectOption, Button } from '@strapi/design-system';
import { Mail } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { useQuery, useMutation } from 'react-query';
import { styled } from 'styled-components';
import { ValidationError } from 'yup';
import { PERMISSIONS } from '../constants.mjs';
import { getYupInnerErrors } from '../utils/getYupInnerErrors.mjs';
import { schema } from '../utils/schema.mjs';

const DocumentationLink = styled.a`
  color: ${({ theme })=>theme.colors.primary600};
`;
const ProtectedSettingsPage = ()=>/*#__PURE__*/ jsx(Page.Protect, {
        permissions: PERMISSIONS.settings,
        children: /*#__PURE__*/ jsx(SettingsPage, {})
    });
const SettingsPage = ()=>{
    const { toggleNotification } = useNotification();
    const { formatMessage } = useIntl();
    const { get, post } = useFetchClient();
    const [testAddress, setTestAddress] = React.useState('');
    const [isTestAddressValid, setIsTestAddressValid] = React.useState(false);
    // TODO: I'm not sure how to type this. I think it should be Record<string, TranslationMessage> but that type is defined in the helper-plugin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [formErrors, setFormErrors] = React.useState({});
    const { data, isLoading } = useQuery([
        'email',
        'settings'
    ], async ()=>{
        const res = await get('/email/settings');
        const { data: { config } } = res;
        return config;
    });
    const mutation = useMutation(async (body)=>{
        await post('/email/test', body);
    }, {
        onError () {
            toggleNotification({
                type: 'danger',
                message: formatMessage({
                    id: 'email.Settings.email.plugin.notification.test.error',
                    defaultMessage: 'Failed to send a test mail to {to}'
                }, {
                    to: testAddress
                })
            });
        },
        onSuccess () {
            toggleNotification({
                type: 'success',
                message: formatMessage({
                    id: 'email.Settings.email.plugin.notification.test.success',
                    defaultMessage: 'Email test succeeded, check the {to} mailbox'
                }, {
                    to: testAddress
                })
            });
        },
        retry: false
    });
    React.useEffect(()=>{
        schema.validate({
            email: testAddress
        }, {
            abortEarly: false
        }).then(()=>setIsTestAddressValid(true)).catch(()=>setIsTestAddressValid(false));
    }, [
        testAddress
    ]);
    const handleChange = (event)=>{
        setTestAddress(()=>event.target.value);
    };
    const handleSubmit = async (event)=>{
        event.preventDefault();
        try {
            await schema.validate({
                email: testAddress
            }, {
                abortEarly: false
            });
        } catch (error) {
            if (error instanceof ValidationError) {
                setFormErrors(getYupInnerErrors(error));
            }
        }
        mutation.mutate({
            to: testAddress
        });
    };
    if (isLoading) {
        return /*#__PURE__*/ jsx(Page.Loading, {});
    }
    return /*#__PURE__*/ jsxs(Page.Main, {
        labelledBy: "title",
        "aria-busy": isLoading || mutation.isLoading,
        children: [
            /*#__PURE__*/ jsx(Page.Title, {
                children: formatMessage({
                    id: 'Settings.PageTitle',
                    defaultMessage: 'Settings - {name}'
                }, {
                    name: formatMessage({
                        id: 'email.Settings.email.plugin.title',
                        defaultMessage: 'Configuration'
                    })
                })
            }),
            /*#__PURE__*/ jsx(Layouts.Header, {
                id: "title",
                title: formatMessage({
                    id: 'email.Settings.email.plugin.title',
                    defaultMessage: 'Configuration'
                }),
                subtitle: formatMessage({
                    id: 'email.Settings.email.plugin.subTitle',
                    defaultMessage: 'Test the settings for the Email plugin'
                })
            }),
            /*#__PURE__*/ jsx(Layouts.Content, {
                children: data && /*#__PURE__*/ jsx("form", {
                    onSubmit: handleSubmit,
                    children: /*#__PURE__*/ jsxs(Flex, {
                        direction: "column",
                        alignItems: "stretch",
                        gap: 7,
                        children: [
                            /*#__PURE__*/ jsx(Box, {
                                background: "neutral0",
                                hasRadius: true,
                                shadow: "filterShadow",
                                paddingTop: 6,
                                paddingBottom: 6,
                                paddingLeft: 7,
                                paddingRight: 7,
                                children: /*#__PURE__*/ jsxs(Flex, {
                                    direction: "column",
                                    alignItems: "stretch",
                                    gap: 4,
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
                                                        id: 'email.Settings.email.plugin.title.config',
                                                        defaultMessage: 'Configuration'
                                                    })
                                                }),
                                                /*#__PURE__*/ jsx(Typography, {
                                                    children: formatMessage({
                                                        id: 'email.Settings.email.plugin.text.configuration',
                                                        defaultMessage: 'The plugin is configured through the {file} file, checkout this {link} for the documentation.'
                                                    }, {
                                                        file: './config/plugins.js',
                                                        link: /*#__PURE__*/ jsx(DocumentationLink, {
                                                            href: "https://docs.strapi.io/developer-docs/latest/plugins/email.html",
                                                            target: "_blank",
                                                            rel: "noopener noreferrer",
                                                            children: formatMessage({
                                                                id: 'email.link',
                                                                defaultMessage: 'Link'
                                                            })
                                                        })
                                                    })
                                                })
                                            ]
                                        }),
                                        /*#__PURE__*/ jsxs(Grid.Root, {
                                            gap: 5,
                                            children: [
                                                /*#__PURE__*/ jsx(Grid.Item, {
                                                    col: 6,
                                                    s: 12,
                                                    direction: "column",
                                                    alignItems: "stretch",
                                                    children: /*#__PURE__*/ jsxs(Field.Root, {
                                                        name: "shipper-email",
                                                        children: [
                                                            /*#__PURE__*/ jsx(Field.Label, {
                                                                children: formatMessage({
                                                                    id: 'email.Settings.email.plugin.label.defaultFrom',
                                                                    defaultMessage: 'Default sender email'
                                                                })
                                                            }),
                                                            /*#__PURE__*/ jsx(TextInput, {
                                                                placeholder: formatMessage({
                                                                    id: 'email.Settings.email.plugin.placeholder.defaultFrom',
                                                                    defaultMessage: "ex: Strapi No-Reply '<'no-reply@strapi.io'>'"
                                                                }),
                                                                disabled: true,
                                                                value: data.settings.defaultFrom
                                                            })
                                                        ]
                                                    })
                                                }),
                                                /*#__PURE__*/ jsx(Grid.Item, {
                                                    col: 6,
                                                    s: 12,
                                                    direction: "column",
                                                    alignItems: "stretch",
                                                    children: /*#__PURE__*/ jsxs(Field.Root, {
                                                        name: "response-email",
                                                        children: [
                                                            /*#__PURE__*/ jsx(Field.Label, {
                                                                children: formatMessage({
                                                                    id: 'email.Settings.email.plugin.label.defaultReplyTo',
                                                                    defaultMessage: 'Default response email'
                                                                })
                                                            }),
                                                            /*#__PURE__*/ jsx(TextInput, {
                                                                placeholder: formatMessage({
                                                                    id: 'email.Settings.email.plugin.placeholder.defaultReplyTo',
                                                                    defaultMessage: `ex: Strapi '<'example@strapi.io'>'`
                                                                }),
                                                                disabled: true,
                                                                value: data.settings.defaultReplyTo
                                                            })
                                                        ]
                                                    })
                                                }),
                                                /*#__PURE__*/ jsx(Grid.Item, {
                                                    col: 6,
                                                    s: 12,
                                                    direction: "column",
                                                    alignItems: "stretch",
                                                    children: /*#__PURE__*/ jsxs(Field.Root, {
                                                        name: "email-provider",
                                                        children: [
                                                            /*#__PURE__*/ jsx(Field.Label, {
                                                                children: formatMessage({
                                                                    id: 'email.Settings.email.plugin.label.provider',
                                                                    defaultMessage: 'Email provider'
                                                                })
                                                            }),
                                                            /*#__PURE__*/ jsx(SingleSelect, {
                                                                disabled: true,
                                                                value: data.provider,
                                                                children: /*#__PURE__*/ jsx(SingleSelectOption, {
                                                                    value: data.provider,
                                                                    children: data.provider
                                                                })
                                                            })
                                                        ]
                                                    })
                                                })
                                            ]
                                        })
                                    ]
                                })
                            }),
                            /*#__PURE__*/ jsxs(Flex, {
                                alignItems: "stretch",
                                background: "neutral0",
                                direction: "column",
                                gap: 4,
                                hasRadius: true,
                                shadow: "filterShadow",
                                paddingTop: 6,
                                paddingBottom: 6,
                                paddingLeft: 7,
                                paddingRight: 7,
                                children: [
                                    /*#__PURE__*/ jsx(Typography, {
                                        variant: "delta",
                                        tag: "h2",
                                        children: formatMessage({
                                            id: 'email.Settings.email.plugin.title.test',
                                            defaultMessage: 'Test email delivery'
                                        })
                                    }),
                                    /*#__PURE__*/ jsxs(Grid.Root, {
                                        gap: 5,
                                        children: [
                                            /*#__PURE__*/ jsx(Grid.Item, {
                                                col: 6,
                                                s: 12,
                                                direction: "column",
                                                alignItems: "stretch",
                                                children: /*#__PURE__*/ jsxs(Field.Root, {
                                                    name: "test-address",
                                                    error: formErrors.email?.id && formatMessage({
                                                        id: `email.${formErrors.email?.id}`,
                                                        defaultMessage: 'This is not a valid email'
                                                    }),
                                                    children: [
                                                        /*#__PURE__*/ jsx(Field.Label, {
                                                            children: formatMessage({
                                                                id: 'email.Settings.email.plugin.label.testAddress',
                                                                defaultMessage: 'Recipient email'
                                                            })
                                                        }),
                                                        /*#__PURE__*/ jsx(TextInput, {
                                                            onChange: handleChange,
                                                            value: testAddress,
                                                            placeholder: formatMessage({
                                                                id: 'email.Settings.email.plugin.placeholder.testAddress',
                                                                defaultMessage: 'ex: developer@example.com'
                                                            })
                                                        })
                                                    ]
                                                })
                                            }),
                                            /*#__PURE__*/ jsx(Grid.Item, {
                                                col: 7,
                                                s: 12,
                                                direction: "column",
                                                alignItems: "start",
                                                children: /*#__PURE__*/ jsx(Button, {
                                                    loading: mutation.isLoading,
                                                    disabled: !isTestAddressValid,
                                                    type: "submit",
                                                    startIcon: /*#__PURE__*/ jsx(Mail, {}),
                                                    children: formatMessage({
                                                        id: 'email.Settings.email.plugin.button.test-email',
                                                        defaultMessage: 'Send test email'
                                                    })
                                                })
                                            })
                                        ]
                                    })
                                ]
                            })
                        ]
                    })
                })
            })
        ]
    });
};

export { ProtectedSettingsPage };
//# sourceMappingURL=Settings.mjs.map
