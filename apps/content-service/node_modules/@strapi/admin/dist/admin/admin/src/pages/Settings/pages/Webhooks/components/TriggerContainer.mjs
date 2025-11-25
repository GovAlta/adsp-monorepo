import { jsx, jsxs } from 'react/jsx-runtime';
import { Box, Grid, Typography, Flex } from '@strapi/design-system';
import { Cross, Loader, Check } from '@strapi/icons';
import { useIntl } from 'react-intl';

const TriggerContainer = ({ isPending, onCancel, response })=>{
    const { statusCode, message } = response ?? {};
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsx(Box, {
        background: "neutral0",
        padding: 5,
        shadow: "filterShadow",
        hasRadius: true,
        children: /*#__PURE__*/ jsxs(Grid.Root, {
            gap: 4,
            style: {
                alignItems: 'center'
            },
            children: [
                /*#__PURE__*/ jsx(Grid.Item, {
                    col: 3,
                    direction: "column",
                    alignItems: "stretch",
                    children: /*#__PURE__*/ jsx(Typography, {
                        children: formatMessage({
                            id: 'Settings.webhooks.trigger.test',
                            defaultMessage: 'Test-trigger'
                        })
                    })
                }),
                /*#__PURE__*/ jsx(Grid.Item, {
                    col: 3,
                    direction: "column",
                    alignItems: "stretch",
                    children: /*#__PURE__*/ jsx(Status, {
                        isPending: isPending,
                        statusCode: statusCode
                    })
                }),
                /*#__PURE__*/ jsx(Grid.Item, {
                    col: 6,
                    direction: "column",
                    alignItems: "stretch",
                    children: !isPending ? /*#__PURE__*/ jsx(Message, {
                        statusCode: statusCode,
                        message: message
                    }) : /*#__PURE__*/ jsx(Flex, {
                        justifyContent: "flex-end",
                        children: /*#__PURE__*/ jsx("button", {
                            onClick: onCancel,
                            type: "button",
                            children: /*#__PURE__*/ jsxs(Flex, {
                                gap: 2,
                                alignItems: "center",
                                children: [
                                    /*#__PURE__*/ jsx(Typography, {
                                        textColor: "neutral400",
                                        children: formatMessage({
                                            id: 'Settings.webhooks.trigger.cancel',
                                            defaultMessage: 'cancel'
                                        })
                                    }),
                                    /*#__PURE__*/ jsx(Cross, {
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
    const { formatMessage } = useIntl();
    if (isPending || !statusCode) {
        return /*#__PURE__*/ jsxs(Flex, {
            gap: 2,
            alignItems: "center",
            children: [
                /*#__PURE__*/ jsx(Loader, {
                    height: "1.2rem",
                    width: "1.2rem"
                }),
                /*#__PURE__*/ jsx(Typography, {
                    children: formatMessage({
                        id: 'Settings.webhooks.trigger.pending',
                        defaultMessage: 'pending'
                    })
                })
            ]
        });
    }
    if (statusCode >= 200 && statusCode < 300) {
        return /*#__PURE__*/ jsxs(Flex, {
            gap: 2,
            alignItems: "center",
            children: [
                /*#__PURE__*/ jsx(Check, {
                    fill: "success700",
                    height: "1.2rem",
                    width: "1.2rem"
                }),
                /*#__PURE__*/ jsx(Typography, {
                    children: formatMessage({
                        id: 'Settings.webhooks.trigger.success',
                        defaultMessage: 'success'
                    })
                })
            ]
        });
    }
    if (statusCode >= 300) {
        return /*#__PURE__*/ jsxs(Flex, {
            gap: 2,
            alignItems: "center",
            children: [
                /*#__PURE__*/ jsx(Cross, {
                    fill: "danger700",
                    height: "1.2rem",
                    width: "1.2rem"
                }),
                /*#__PURE__*/ jsxs(Typography, {
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
    const { formatMessage } = useIntl();
    if (!statusCode) {
        return null;
    }
    if (statusCode >= 200 && statusCode < 300) {
        return /*#__PURE__*/ jsx(Flex, {
            justifyContent: "flex-end",
            children: /*#__PURE__*/ jsx(Typography, {
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
        return /*#__PURE__*/ jsx(Flex, {
            justifyContent: "flex-end",
            children: /*#__PURE__*/ jsx(Flex, {
                maxWidth: `25rem`,
                justifyContent: "flex-end",
                title: message,
                children: /*#__PURE__*/ jsx(Typography, {
                    ellipsis: true,
                    textColor: "neutral600",
                    children: message
                })
            })
        });
    }
    return null;
};

export { TriggerContainer };
//# sourceMappingURL=TriggerContainer.mjs.map
