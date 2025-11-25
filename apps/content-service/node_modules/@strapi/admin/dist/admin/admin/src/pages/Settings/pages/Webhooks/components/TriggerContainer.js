'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');

const TriggerContainer = ({ isPending, onCancel, response })=>{
    const { statusCode, message } = response ?? {};
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
        background: "neutral0",
        padding: 5,
        shadow: "filterShadow",
        hasRadius: true,
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Grid.Root, {
            gap: 4,
            style: {
                alignItems: 'center'
            },
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                    col: 3,
                    direction: "column",
                    alignItems: "stretch",
                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                        children: formatMessage({
                            id: 'Settings.webhooks.trigger.test',
                            defaultMessage: 'Test-trigger'
                        })
                    })
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                    col: 3,
                    direction: "column",
                    alignItems: "stretch",
                    children: /*#__PURE__*/ jsxRuntime.jsx(Status, {
                        isPending: isPending,
                        statusCode: statusCode
                    })
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                    col: 6,
                    direction: "column",
                    alignItems: "stretch",
                    children: !isPending ? /*#__PURE__*/ jsxRuntime.jsx(Message, {
                        statusCode: statusCode,
                        message: message
                    }) : /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                        justifyContent: "flex-end",
                        children: /*#__PURE__*/ jsxRuntime.jsx("button", {
                            onClick: onCancel,
                            type: "button",
                            children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                gap: 2,
                                alignItems: "center",
                                children: [
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                        textColor: "neutral400",
                                        children: formatMessage({
                                            id: 'Settings.webhooks.trigger.cancel',
                                            defaultMessage: 'cancel'
                                        })
                                    }),
                                    /*#__PURE__*/ jsxRuntime.jsx(icons.Cross, {
                                        fill: "neutral400",
                                        height: "1.2rem",
                                        width: "1.2rem"
                                    })
                                ]
                            })
                        })
                    })
                })
            ]
        })
    });
};
const Status = ({ isPending, statusCode })=>{
    const { formatMessage } = reactIntl.useIntl();
    if (isPending || !statusCode) {
        return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
            gap: 2,
            alignItems: "center",
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(icons.Loader, {
                    height: "1.2rem",
                    width: "1.2rem"
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                    children: formatMessage({
                        id: 'Settings.webhooks.trigger.pending',
                        defaultMessage: 'pending'
                    })
                })
            ]
        });
    }
    if (statusCode >= 200 && statusCode < 300) {
        return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
            gap: 2,
            alignItems: "center",
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(icons.Check, {
                    fill: "success700",
                    height: "1.2rem",
                    width: "1.2rem"
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                    children: formatMessage({
                        id: 'Settings.webhooks.trigger.success',
                        defaultMessage: 'success'
                    })
                })
            ]
        });
    }
    if (statusCode >= 300) {
        return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
            gap: 2,
            alignItems: "center",
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(icons.Cross, {
                    fill: "danger700",
                    height: "1.2rem",
                    width: "1.2rem"
                }),
                /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Typography, {
                    children: [
                        formatMessage({
                            id: 'Settings.error',
                            defaultMessage: 'error'
                        }),
                        " ",
                        statusCode
                    ]
                })
            ]
        });
    }
    return null;
};
const Message = ({ statusCode, message })=>{
    const { formatMessage } = reactIntl.useIntl();
    if (!statusCode) {
        return null;
    }
    if (statusCode >= 200 && statusCode < 300) {
        return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
            justifyContent: "flex-end",
            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                textColor: "neutral600",
                ellipsis: true,
                children: formatMessage({
                    id: 'Settings.webhooks.trigger.success.label',
                    defaultMessage: 'Trigger succeeded'
                })
            })
        });
    }
    if (statusCode >= 300) {
        return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
            justifyContent: "flex-end",
            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                maxWidth: `25rem`,
                justifyContent: "flex-end",
                title: message,
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                    ellipsis: true,
                    textColor: "neutral600",
                    children: message
                })
            })
        });
    }
    return null;
};

exports.TriggerContainer = TriggerContainer;
//# sourceMappingURL=TriggerContainer.js.map
