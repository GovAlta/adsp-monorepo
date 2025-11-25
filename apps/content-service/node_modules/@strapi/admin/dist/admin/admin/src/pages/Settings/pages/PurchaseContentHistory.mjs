import { jsx, Fragment, jsxs } from 'react/jsx-runtime';
import { Main, Box, Grid, Flex, Typography, LinkButton } from '@strapi/design-system';
import { ClockCounterClockwise, Check, ExternalLink } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { Layouts } from '../../../components/Layouts/Layout.mjs';
import { RESPONSIVE_DEFAULT_SPACING } from '../../../constants/theme.mjs';
import { useTypedSelector } from '../../../core/store/hooks.mjs';
import img$1 from '../assets/purchase-page-content-history-illustration-dark.svg.mjs';
import img from '../assets/purchase-page-content-history-illustration-light.svg.mjs';

const PurchaseContentHistory = ()=>{
    const { formatMessage } = useIntl();
    const currentTheme = useTypedSelector((state)=>state.admin_app.theme.currentTheme);
    const illustration = currentTheme === 'light' ? img : img$1;
    return /*#__PURE__*/ jsx(Fragment, {
        children: /*#__PURE__*/ jsxs(Main, {
            children: [
                /*#__PURE__*/ jsx(Layouts.Header, {
                    title: formatMessage({
                        id: 'Settings.content-history.title',
                        defaultMessage: 'Content History'
                    })
                }),
                /*#__PURE__*/ jsx(Box, {
                    marginLeft: RESPONSIVE_DEFAULT_SPACING,
                    marginRight: RESPONSIVE_DEFAULT_SPACING,
                    shadow: "filterShadow",
                    hasRadius: true,
                    background: "neutral0",
                    borderColor: 'neutral150',
                    overflow: 'hidden',
                    children: /*#__PURE__*/ jsxs(Grid.Root, {
                        children: [
                            /*#__PURE__*/ jsx(Grid.Item, {
                                col: 6,
                                s: 12,
                                alignItems: 'flex-start',
                                children: /*#__PURE__*/ jsxs(Flex, {
                                    direction: "column",
                                    alignItems: "flex-start",
                                    padding: 7,
                                    width: '100%',
                                    children: [
                                        /*#__PURE__*/ jsx(Flex, {
                                            children: /*#__PURE__*/ jsx(ClockCounterClockwise, {
                                                fill: "primary600",
                                                width: `24px`,
                                                height: `24px`
                                            })
                                        }),
                                        /*#__PURE__*/ jsx(Flex, {
                                            paddingTop: 3,
                                            paddingBottom: 4,
                                            children: /*#__PURE__*/ jsx(Typography, {
                                                variant: "beta",
                                                fontWeight: "bold",
                                                children: formatMessage({
                                                    id: 'Settings.page.PurchaseContent-history.description',
                                                    defaultMessage: 'Instantly revert content changes'
                                                })
                                            })
                                        }),
                                        /*#__PURE__*/ jsxs(Flex, {
                                            direction: "column",
                                            alignItems: 'flex-start',
                                            gap: 2,
                                            children: [
                                                /*#__PURE__*/ jsxs(Flex, {
                                                    gap: 2,
                                                    children: [
                                                        /*#__PURE__*/ jsx(Check, {
                                                            fill: "success500",
                                                            width: `16px`,
                                                            height: `16px`,
                                                            style: {
                                                                flexShrink: 0
                                                            }
                                                        }),
                                                        /*#__PURE__*/ jsx(Typography, {
                                                            textColor: "neutral700",
                                                            children: formatMessage({
                                                                id: 'Settings.page.PurchaseContent-history.perks1',
                                                                defaultMessage: 'Browse your content history'
                                                            })
                                                        })
                                                    ]
                                                }),
                                                /*#__PURE__*/ jsxs(Flex, {
                                                    gap: 2,
                                                    children: [
                                                        /*#__PURE__*/ jsx(Check, {
                                                            fill: "success500",
                                                            width: `16px`,
                                                            height: `16px`,
                                                            style: {
                                                                flexShrink: 0
                                                            }
                                                        }),
                                                        /*#__PURE__*/ jsx(Typography, {
                                                            textColor: "neutral700",
                                                            children: formatMessage({
                                                                id: 'Settings.page.PurchaseContent-history.perks2',
                                                                defaultMessage: 'Revert changes in one click'
                                                            })
                                                        })
                                                    ]
                                                }),
                                                /*#__PURE__*/ jsxs(Flex, {
                                                    gap: 2,
                                                    children: [
                                                        /*#__PURE__*/ jsx(Check, {
                                                            fill: "success500",
                                                            width: `16px`,
                                                            height: `16px`,
                                                            style: {
                                                                flexShrink: 0
                                                            }
                                                        }),
                                                        /*#__PURE__*/ jsx(Typography, {
                                                            textColor: "neutral700",
                                                            children: formatMessage({
                                                                id: 'Settings.page.PurchaseContent-history.perks3',
                                                                defaultMessage: 'Track changes across locales'
                                                            })
                                                        })
                                                    ]
                                                })
                                            ]
                                        }),
                                        /*#__PURE__*/ jsxs(Flex, {
                                            gap: 2,
                                            marginTop: 7,
                                            children: [
                                                /*#__PURE__*/ jsx(LinkButton, {
                                                    variant: "default",
                                                    href: "https://strapi.io/pricing-self-hosted?utm_campaign=In-Product-CTA&utm_source=Content-History",
                                                    children: formatMessage({
                                                        id: 'Settings.page.purchase.upgrade.cta',
                                                        defaultMessage: 'Upgrade'
                                                    })
                                                }),
                                                /*#__PURE__*/ jsx(LinkButton, {
                                                    variant: "tertiary",
                                                    endIcon: /*#__PURE__*/ jsx(ExternalLink, {}),
                                                    href: "https://strapi.io/features/content-history?utm_campaign=In-Product-CTA&utm_source=Content-History",
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
                            /*#__PURE__*/ jsx(Grid.Item, {
                                col: 6,
                                s: 12,
                                background: "primary100",
                                minHeight: '280px',
                                children: /*#__PURE__*/ jsx("div", {
                                    style: {
                                        position: 'relative',
                                        width: '100%',
                                        height: '100%'
                                    },
                                    children: /*#__PURE__*/ jsx("img", {
                                        src: illustration,
                                        alt: "purchase-page-content-history-illustration",
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

export { PurchaseContentHistory };
//# sourceMappingURL=PurchaseContentHistory.mjs.map
