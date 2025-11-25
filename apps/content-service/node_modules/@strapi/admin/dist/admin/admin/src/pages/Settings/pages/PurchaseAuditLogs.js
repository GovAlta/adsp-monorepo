'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var Layout = require('../../../components/Layouts/Layout.js');
var theme = require('../../../constants/theme.js');
var hooks = require('../../../core/store/hooks.js');
var purchasePageAuditLogsIllustrationDark = require('../assets/purchase-page-audit-logs-illustration-dark.svg.js');
var purchasePageAuditLogsIllustrationLight = require('../assets/purchase-page-audit-logs-illustration-light.svg.js');

const PurchaseAuditLogs = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    const currentTheme = hooks.useTypedSelector((state)=>state.admin_app.theme.currentTheme);
    const illustration = currentTheme === 'light' ? purchasePageAuditLogsIllustrationLight : purchasePageAuditLogsIllustrationDark;
    return /*#__PURE__*/ jsxRuntime.jsx(jsxRuntime.Fragment, {
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Main, {
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(Layout.Layouts.Header, {
                    title: formatMessage({
                        id: 'global.auditLogs',
                        defaultMessage: 'Audit Logs'
                    })
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                    marginLeft: theme.RESPONSIVE_DEFAULT_SPACING,
                    marginRight: theme.RESPONSIVE_DEFAULT_SPACING,
                    shadow: "filterShadow",
                    hasRadius: true,
                    background: "neutral0",
                    borderColor: 'neutral150',
                    overflow: 'hidden',
                    children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Grid.Root, {
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                                col: 6,
                                s: 12,
                                alignItems: 'flex-start',
                                children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                    direction: "column",
                                    alignItems: "flex-start",
                                    padding: 7,
                                    width: '100%',
                                    children: [
                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                                            children: /*#__PURE__*/ jsxRuntime.jsx(icons.ListSearch, {
                                                fill: "primary600",
                                                width: `24px`,
                                                height: `24px`
                                            })
                                        }),
                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                                            paddingTop: 3,
                                            paddingBottom: 4,
                                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                variant: "beta",
                                                fontWeight: "bold",
                                                children: formatMessage({
                                                    id: 'Settings.page.PurchaseAudit-logs.description',
                                                    defaultMessage: 'Track and review changes with your team'
                                                })
                                            })
                                        }),
                                        /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                            direction: "column",
                                            alignItems: 'flex-start',
                                            gap: 2,
                                            children: [
                                                /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                                    gap: 2,
                                                    children: [
                                                        /*#__PURE__*/ jsxRuntime.jsx(icons.Check, {
                                                            fill: "success500",
                                                            width: `16px`,
                                                            height: `16px`,
                                                            style: {
                                                                flexShrink: 0
                                                            }
                                                        }),
                                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                            textColor: "neutral700",
                                                            children: formatMessage({
                                                                id: 'Settings.page.PurchaseAudit-logs.perks1',
                                                                defaultMessage: 'Easily track changes'
                                                            })
                                                        })
                                                    ]
                                                }),
                                                /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                                    gap: 2,
                                                    children: [
                                                        /*#__PURE__*/ jsxRuntime.jsx(icons.Check, {
                                                            fill: "success500",
                                                            width: `16px`,
                                                            height: `16px`,
                                                            style: {
                                                                flexShrink: 0
                                                            }
                                                        }),
                                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                            textColor: "neutral700",
                                                            children: formatMessage({
                                                                id: 'Settings.page.PurchaseAudit-logs.perks2',
                                                                defaultMessage: 'Review changes with ease'
                                                            })
                                                        })
                                                    ]
                                                }),
                                                /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                                    gap: 2,
                                                    children: [
                                                        /*#__PURE__*/ jsxRuntime.jsx(icons.Check, {
                                                            fill: "success500",
                                                            width: `16px`,
                                                            height: `16px`,
                                                            style: {
                                                                flexShrink: 0
                                                            }
                                                        }),
                                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                            textColor: "neutral700",
                                                            children: formatMessage({
                                                                id: 'Settings.page.PurchaseAudit-logs.perks3',
                                                                defaultMessage: 'Maintain security and compliance'
                                                            })
                                                        })
                                                    ]
                                                })
                                            ]
                                        }),
                                        /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                            gap: 2,
                                            marginTop: 7,
                                            children: [
                                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.LinkButton, {
                                                    variant: "default",
                                                    href: "https://strapi.io/pricing-self-hosted?utm_campaign=In-Product-CTA&utm_source=Audit-Logs",
                                                    children: formatMessage({
                                                        id: 'Settings.page.purchase.upgrade.cta',
                                                        defaultMessage: 'Upgrade'
                                                    })
                                                }),
                                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.LinkButton, {
                                                    variant: "tertiary",
                                                    endIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.ExternalLink, {}),
                                                    href: "https://strapi.io/features/audit-logs?utm_campaign=In-Product-CTA&utm_source=Audit-Logs",
                                                    children: formatMessage({
                                                        id: 'Settings.page.purchase.learn-more.cta',
                                                        defaultMessage: 'Learn more'
                                                    })
                                                })
                                            ]
                                        })
                                    ]
                                })
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                                col: 6,
                                s: 12,
                                background: "primary100",
                                minHeight: '280px',
                                children: /*#__PURE__*/ jsxRuntime.jsx("div", {
                                    style: {
                                        position: 'relative',
                                        width: '100%',
                                        height: '100%'
                                    },
                                    children: /*#__PURE__*/ jsxRuntime.jsx("img", {
                                        src: illustration,
                                        alt: "purchase-page-audit-logs-illustration",
                                        width: "100%",
                                        height: "100%",
                                        style: {
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            objectPosition: 'top left'
                                        }
                                    })
                                })
                            })
                        ]
                    })
                })
            ]
        })
    });
};

exports.PurchaseAuditLogs = PurchaseAuditLogs;
//# sourceMappingURL=PurchaseAuditLogs.js.map
