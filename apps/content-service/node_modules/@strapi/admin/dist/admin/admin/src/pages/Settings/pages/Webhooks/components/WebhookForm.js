'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var yup = require('yup');
var Form = require('../../../../../components/Form.js');
var Renderer = require('../../../../../components/FormInputs/Renderer.js');
var Layout = require('../../../../../components/Layouts/Layout.js');
var BackButton = require('../../../../../features/BackButton.js');
var useEnterprise = require('../../../../../hooks/useEnterprise.js');
var EventsTable = require('./EventsTable.js');
var HeadersInput = require('./HeadersInput.js');
var TriggerContainer = require('./TriggerContainer.js');

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

const WebhookForm = ({ handleSubmit, triggerWebhook, isCreating, isTriggering, triggerResponse, data })=>{
    const { formatMessage } = reactIntl.useIntl();
    const [showTriggerResponse, setShowTriggerResponse] = React__namespace.useState(false);
    const EventTable = useEnterprise.useEnterprise(EventsTable.EventTableCE, async ()=>(await Promise.resolve().then(function () { return require('../../../../../../../ee/admin/src/pages/SettingsPage/pages/Webhooks/components/EventsTable.js'); })).EventsTableEE);
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
    return /*#__PURE__*/ jsxRuntime.jsx(Form.Form, {
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
        children: ({ isSubmitting, modified })=>/*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(Layout.Layouts.Header, {
                        primaryAction: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                            gap: 2,
                            children: [
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                    onClick: ()=>{
                                        triggerWebhook();
                                        setShowTriggerResponse(true);
                                    },
                                    variant: "tertiary",
                                    startIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.Play, {}),
                                    disabled: isCreating || isTriggering,
                                    children: formatMessage({
                                        id: 'Settings.webhooks.trigger',
                                        defaultMessage: 'Trigger'
                                    })
                                }),
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                    startIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.Check, {}),
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
                        navigationAction: /*#__PURE__*/ jsxRuntime.jsx(BackButton.BackButton, {
                            fallback: "../webhooks"
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(Layout.Layouts.Content, {
                        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                            direction: "column",
                            alignItems: "stretch",
                            gap: 4,
                            children: [
                                showTriggerResponse && /*#__PURE__*/ jsxRuntime.jsx(TriggerContainer.TriggerContainer, {
                                    isPending: isTriggering,
                                    response: triggerResponse,
                                    onCancel: ()=>setShowTriggerResponse(false)
                                }),
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                    background: "neutral0",
                                    padding: 8,
                                    shadow: "filterShadow",
                                    hasRadius: true,
                                    children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                        direction: "column",
                                        alignItems: "stretch",
                                        gap: 6,
                                        children: [
                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Root, {
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
                                                ].map(({ size, ...field })=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                                                        col: size,
                                                        direction: "column",
                                                        alignItems: "stretch",
                                                        children: /*#__PURE__*/ jsxRuntime.jsx(Renderer.InputRenderer, {
                                                            ...field
                                                        })
                                                    }, field.name))
                                            }),
                                            /*#__PURE__*/ jsxRuntime.jsx(HeadersInput.HeadersInput, {}),
                                            /*#__PURE__*/ jsxRuntime.jsx(EventTable, {})
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
const makeWebhookValidationSchema = ({ formatMessage })=>yup__namespace.object().shape({
        name: yup__namespace.string().nullable().required(formatMessage({
            id: 'Settings.webhooks.validation.name.required',
            defaultMessage: 'Name is required'
        })).matches(NAME_REGEX, formatMessage({
            id: 'Settings.webhooks.validation.name.regex',
            defaultMessage: 'The name must start with a letter and only contain letters, numbers, spaces and underscores'
        })),
        url: yup__namespace.string().nullable().required(formatMessage({
            id: 'Settings.webhooks.validation.url.required',
            defaultMessage: 'Url is required'
        })).matches(URL_REGEX, formatMessage({
            id: 'Settings.webhooks.validation.url.regex',
            defaultMessage: 'The value must be a valid Url'
        })),
        headers: yup__namespace.lazy((array)=>{
            const baseSchema = yup__namespace.array();
            if (array.length === 1) {
                const { key, value } = array[0];
                if (!key && !value) {
                    return baseSchema;
                }
            }
            return baseSchema.of(yup__namespace.object().shape({
                key: yup__namespace.string().required(formatMessage({
                    id: 'Settings.webhooks.validation.key',
                    defaultMessage: 'Key is required'
                })).nullable(),
                value: yup__namespace.string().required(formatMessage({
                    id: 'Settings.webhooks.validation.value',
                    defaultMessage: 'Value is required'
                })).nullable()
            }));
        }),
        events: yup__namespace.array()
    });

exports.WebhookForm = WebhookForm;
//# sourceMappingURL=WebhookForm.js.map
