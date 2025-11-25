import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import * as React from 'react';
import { Flex, Button, Box, Grid } from '@strapi/design-system';
import { Play, Check } from '@strapi/icons';
import { useIntl } from 'react-intl';
import * as yup from 'yup';
import { Form } from '../../../../../components/Form.mjs';
import { InputRenderer as MemoizedInputRenderer } from '../../../../../components/FormInputs/Renderer.mjs';
import { Layouts } from '../../../../../components/Layouts/Layout.mjs';
import { BackButton } from '../../../../../features/BackButton.mjs';
import { useEnterprise } from '../../../../../hooks/useEnterprise.mjs';
import { EventTableCE } from './EventsTable.mjs';
import { HeadersInput } from './HeadersInput.mjs';
import { TriggerContainer } from './TriggerContainer.mjs';

const WebhookForm = ({ handleSubmit, triggerWebhook, isCreating, isTriggering, triggerResponse, data })=>{
    const { formatMessage } = useIntl();
    const [showTriggerResponse, setShowTriggerResponse] = React.useState(false);
    const EventTable = useEnterprise(EventTableCE, async ()=>(await import('../../../../../../../ee/admin/src/pages/SettingsPage/pages/Webhooks/components/EventsTable.mjs')).EventsTableEE);
    /**
   * Map the headers into a form that can be used within the formik form
   */ const mapHeaders = (headers)=>{
        if (!Object.keys(headers).length) {
            return [
                {
                    key: '',
                    value: ''
                }
            ];
        }
        return Object.entries(headers).map(([key, value])=>({
                key,
                value
            }));
    };
    // block rendering until the EE component is fully loaded
    if (!EventTable) {
        return null;
    }
    return /*#__PURE__*/ jsx(Form, {
        initialValues: {
            name: data?.name || '',
            url: data?.url || '',
            headers: mapHeaders(data?.headers || {}),
            events: data?.events || []
        },
        method: isCreating ? 'POST' : 'PUT',
        onSubmit: handleSubmit,
        validationSchema: makeWebhookValidationSchema({
            formatMessage
        }),
        children: ({ isSubmitting, modified })=>/*#__PURE__*/ jsxs(Fragment, {
                children: [
                    /*#__PURE__*/ jsx(Layouts.Header, {
                        primaryAction: /*#__PURE__*/ jsxs(Flex, {
                            gap: 2,
                            children: [
                                /*#__PURE__*/ jsx(Button, {
                                    onClick: ()=>{
                                        triggerWebhook();
                                        setShowTriggerResponse(true);
                                    },
                                    variant: "tertiary",
                                    startIcon: /*#__PURE__*/ jsx(Play, {}),
                                    disabled: isCreating || isTriggering,
                                    children: formatMessage({
                                        id: 'Settings.webhooks.trigger',
                                        defaultMessage: 'Trigger'
                                    })
                                }),
                                /*#__PURE__*/ jsx(Button, {
                                    startIcon: /*#__PURE__*/ jsx(Check, {}),
                                    type: "submit",
                                    disabled: !modified,
                                    loading: isSubmitting,
                                    children: formatMessage({
                                        id: 'global.save',
                                        defaultMessage: 'Save'
                                    })
                                })
                            ]
                        }),
                        title: isCreating ? formatMessage({
                            id: 'Settings.webhooks.create',
                            defaultMessage: 'Create a webhook'
                        }) : data?.name,
                        navigationAction: /*#__PURE__*/ jsx(BackButton, {
                            fallback: "../webhooks"
                        })
                    }),
                    /*#__PURE__*/ jsx(Layouts.Content, {
                        children: /*#__PURE__*/ jsxs(Flex, {
                            direction: "column",
                            alignItems: "stretch",
                            gap: 4,
                            children: [
                                showTriggerResponse && /*#__PURE__*/ jsx(TriggerContainer, {
                                    isPending: isTriggering,
                                    response: triggerResponse,
                                    onCancel: ()=>setShowTriggerResponse(false)
                                }),
                                /*#__PURE__*/ jsx(Box, {
                                    background: "neutral0",
                                    padding: 8,
                                    shadow: "filterShadow",
                                    hasRadius: true,
                                    children: /*#__PURE__*/ jsxs(Flex, {
                                        direction: "column",
                                        alignItems: "stretch",
                                        gap: 6,
                                        children: [
                                            /*#__PURE__*/ jsx(Grid.Root, {
                                                gap: 6,
                                                children: [
                                                    {
                                                        label: formatMessage({
                                                            id: 'global.name',
                                                            defaultMessage: 'Name'
                                                        }),
                                                        name: 'name',
                                                        required: true,
                                                        size: 6,
                                                        type: 'string'
                                                    },
                                                    {
                                                        label: formatMessage({
                                                            id: 'Settings.roles.form.input.url',
                                                            defaultMessage: 'Url'
                                                        }),
                                                        name: 'url',
                                                        required: true,
                                                        size: 12,
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
                                            }),
                                            /*#__PURE__*/ jsx(HeadersInput, {}),
                                            /*#__PURE__*/ jsx(EventTable, {})
                                        ]
                                    })
                                })
                            ]
                        })
                    })
                ]
            })
    });
};
const NAME_REGEX = /(^$)|(^[A-Za-z][_0-9A-Za-z ]*$)/;
const URL_REGEX = /(^$)|((https?:\/\/.*)(d*)\/?(.*))/;
const makeWebhookValidationSchema = ({ formatMessage })=>yup.object().shape({
        name: yup.string().nullable().required(formatMessage({
            id: 'Settings.webhooks.validation.name.required',
            defaultMessage: 'Name is required'
        })).matches(NAME_REGEX, formatMessage({
            id: 'Settings.webhooks.validation.name.regex',
            defaultMessage: 'The name must start with a letter and only contain letters, numbers, spaces and underscores'
        })),
        url: yup.string().nullable().required(formatMessage({
            id: 'Settings.webhooks.validation.url.required',
            defaultMessage: 'Url is required'
        })).matches(URL_REGEX, formatMessage({
            id: 'Settings.webhooks.validation.url.regex',
            defaultMessage: 'The value must be a valid Url'
        })),
        headers: yup.lazy((array)=>{
            const baseSchema = yup.array();
            if (array.length === 1) {
                const { key, value } = array[0];
                if (!key && !value) {
                    return baseSchema;
                }
            }
            return baseSchema.of(yup.object().shape({
                key: yup.string().required(formatMessage({
                    id: 'Settings.webhooks.validation.key',
                    defaultMessage: 'Key is required'
                })).nullable(),
                value: yup.string().required(formatMessage({
                    id: 'Settings.webhooks.validation.value',
                    defaultMessage: 'Value is required'
                })).nullable()
            }));
        }),
        events: yup.array()
    });

export { WebhookForm };
//# sourceMappingURL=WebhookForm.mjs.map
