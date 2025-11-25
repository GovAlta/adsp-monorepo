import { jsxs, Fragment, jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { Button, Flex, Typography, Grid, Link, Box } from '@strapi/design-system';
import { Check, ExternalLink } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import { Layouts } from '../../../../components/Layouts/Layout.mjs';
import { Page } from '../../../../components/PageHelpers.mjs';
import { useAppInfo } from '../../../../features/AppInfo.mjs';
import { useConfiguration } from '../../../../features/Configuration.mjs';
import { useTracking } from '../../../../features/Tracking.mjs';
import { useEnterprise } from '../../../../hooks/useEnterprise.mjs';
import { useFetchClient } from '../../../../hooks/useFetchClient.mjs';
import { useRBAC } from '../../../../hooks/useRBAC.mjs';
import { selectAdminPermissions } from '../../../../selectors.mjs';
import { LogoInput } from './components/LogoInput.mjs';
import { DIMENSION, SIZE } from './utils/constants.mjs';

const AdminSeatInfoCE = ()=>null;
const AIUageDataCE = ()=>null;
/* -------------------------------------------------------------------------------------------------
 * ApplicationInfoPage
 * -----------------------------------------------------------------------------------------------*/ const ApplicationInfoPage = ()=>{
    const { trackUsage } = useTracking();
    const { formatMessage } = useIntl();
    useFetchClient();
    const { logos: serverLogos, updateProjectSettings } = useConfiguration('ApplicationInfoPage');
    const [logos, setLogos] = React.useState({
        menu: serverLogos.menu,
        auth: serverLogos.auth
    });
    const { settings } = useSelector(selectAdminPermissions);
    const communityEdition = useAppInfo('ApplicationInfoPage', (state)=>state.communityEdition);
    const latestStrapiReleaseTag = useAppInfo('ApplicationInfoPage', (state)=>state.latestStrapiReleaseTag);
    const nodeVersion = useAppInfo('ApplicationInfoPage', (state)=>state.nodeVersion);
    const shouldUpdateStrapi = useAppInfo('ApplicationInfoPage', (state)=>state.shouldUpdateStrapi);
    const strapiVersion = useAppInfo('ApplicationInfoPage', (state)=>state.strapiVersion);
    const AdminSeatInfo = useEnterprise(AdminSeatInfoCE, async ()=>(await import('../../../../../../ee/admin/src/pages/SettingsPage/pages/ApplicationInfoPage/components/AdminSeatInfo.mjs')).AdminSeatInfoEE);
    const isAiEnabled = window.strapi.ai?.enabled !== false;
    const AIUsageData = useEnterprise(AIUageDataCE, async ()=>(await import('../../../../../../ee/admin/src/pages/SettingsPage/pages/ApplicationInfoPage/components/AIUsage.mjs')).AIUsage, {
        enabled: isAiEnabled
    });
    const { allowedActions: { canRead, canUpdate } } = useRBAC(settings ? settings['project-settings'] : {});
    const handleSubmit = (e)=>{
        e.preventDefault();
        updateProjectSettings({
            authLogo: logos.auth.custom ?? null,
            menuLogo: logos.menu.custom ?? null
        });
    };
    const handleChangeLogo = (logo)=>(newLogo)=>{
            /**
       * If there's no newLogo value we can assume we're reseting.
       */ if (newLogo === null) {
                trackUsage('didClickResetLogo', {
                    logo
                });
            }
            setLogos((prev)=>({
                    ...prev,
                    [logo]: {
                        ...prev[logo],
                        custom: newLogo
                    }
                }));
        };
    React.useEffect(()=>{
        setLogos({
            menu: serverLogos.menu,
            auth: serverLogos.auth
        });
    }, [
        serverLogos
    ]);
    // block rendering until the EE component is fully loaded
    if (!AdminSeatInfo) {
        return null;
    }
    if (!AIUsageData) {
        return null;
    }
    const isSaveDisabled = logos.auth.custom === serverLogos.auth.custom && logos.menu.custom === serverLogos.menu.custom;
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            /*#__PURE__*/ jsx(Page.Title, {
                children: formatMessage({
                    id: 'Settings.PageTitle',
                    defaultMessage: 'Settings - {name}'
                }, {
                    name: formatMessage({
                        id: 'Settings.application.header',
                        defaultMessage: 'Application'
                    })
                })
            }),
            /*#__PURE__*/ jsx(Page.Main, {
                children: /*#__PURE__*/ jsxs("form", {
                    onSubmit: handleSubmit,
                    children: [
                        /*#__PURE__*/ jsx(Layouts.Header, {
                            title: formatMessage({
                                id: 'Settings.application.title',
                                defaultMessage: 'Overview'
                            }),
                            subtitle: formatMessage({
                                id: 'Settings.application.description',
                                defaultMessage: 'Administration panel’s global information'
                            }),
                            primaryAction: canUpdate && /*#__PURE__*/ jsx(Button, {
                                disabled: isSaveDisabled,
                                type: "submit",
                                startIcon: /*#__PURE__*/ jsx(Check, {}),
                                children: formatMessage({
                                    id: 'global.save',
                                    defaultMessage: 'Save'
                                })
                            })
                        }),
                        /*#__PURE__*/ jsx(Layouts.Content, {
                            children: /*#__PURE__*/ jsxs(Flex, {
                                direction: "column",
                                alignItems: "stretch",
                                gap: 6,
                                children: [
                                    /*#__PURE__*/ jsxs(Flex, {
                                        direction: "column",
                                        alignItems: "stretch",
                                        gap: 4,
                                        hasRadius: true,
                                        background: "neutral0",
                                        shadow: "tableShadow",
                                        paddingTop: 6,
                                        paddingBottom: 6,
                                        paddingRight: 7,
                                        paddingLeft: 7,
                                        children: [
                                            /*#__PURE__*/ jsx(Typography, {
                                                variant: "delta",
                                                tag: "h3",
                                                children: formatMessage({
                                                    id: 'global.details',
                                                    defaultMessage: 'Details'
                                                })
                                            }),
                                            /*#__PURE__*/ jsxs(Grid.Root, {
                                                gap: 5,
                                                tag: "dl",
                                                children: [
                                                    /*#__PURE__*/ jsxs(Grid.Item, {
                                                        col: 6,
                                                        s: 12,
                                                        direction: "column",
                                                        alignItems: "start",
                                                        children: [
                                                            /*#__PURE__*/ jsx(Typography, {
                                                                variant: "sigma",
                                                                textColor: "neutral600",
                                                                tag: "dt",
                                                                children: formatMessage({
                                                                    id: 'Settings.application.strapiVersion',
                                                                    defaultMessage: 'strapi version'
                                                                })
                                                            }),
                                                            /*#__PURE__*/ jsxs(Flex, {
                                                                gap: 3,
                                                                direction: "column",
                                                                alignItems: "start",
                                                                tag: "dd",
                                                                children: [
                                                                    /*#__PURE__*/ jsxs(Typography, {
                                                                        children: [
                                                                            "v",
                                                                            strapiVersion
                                                                        ]
                                                                    }),
                                                                    shouldUpdateStrapi && /*#__PURE__*/ jsx(Link, {
                                                                        href: `https://github.com/strapi/strapi/releases/tag/${latestStrapiReleaseTag}`,
                                                                        endIcon: /*#__PURE__*/ jsx(ExternalLink, {}),
                                                                        children: formatMessage({
                                                                            id: 'Settings.application.link-upgrade',
                                                                            defaultMessage: 'Upgrade your admin panel'
                                                                        })
                                                                    })
                                                                ]
                                                            })
                                                        ]
                                                    }),
                                                    /*#__PURE__*/ jsxs(Grid.Item, {
                                                        col: 6,
                                                        s: 12,
                                                        direction: "column",
                                                        alignItems: "start",
                                                        children: [
                                                            /*#__PURE__*/ jsx(Typography, {
                                                                variant: "sigma",
                                                                textColor: "neutral600",
                                                                tag: "dt",
                                                                children: formatMessage({
                                                                    id: 'Settings.application.edition-title',
                                                                    defaultMessage: 'current edition'
                                                                })
                                                            }),
                                                            /*#__PURE__*/ jsxs(Flex, {
                                                                gap: 3,
                                                                direction: "column",
                                                                alignItems: "start",
                                                                tag: "dd",
                                                                children: [
                                                                    /*#__PURE__*/ jsx(Typography, {
                                                                        children: formatMessage({
                                                                            id: 'Settings.application.ee-or-ce',
                                                                            defaultMessage: '{communityEdition, select, true {Community Edition} other {Enterprise Edition}}'
                                                                        }, {
                                                                            communityEdition
                                                                        })
                                                                    }),
                                                                    /*#__PURE__*/ jsx(Link, {
                                                                        href: "https://strapi.io/pricing-self-hosted",
                                                                        endIcon: /*#__PURE__*/ jsx(ExternalLink, {}),
                                                                        children: formatMessage({
                                                                            id: 'Settings.application.link-pricing',
                                                                            defaultMessage: 'See all pricing plans'
                                                                        })
                                                                    })
                                                                ]
                                                            })
                                                        ]
                                                    }),
                                                    /*#__PURE__*/ jsxs(Grid.Item, {
                                                        col: 6,
                                                        s: 12,
                                                        direction: "column",
                                                        alignItems: "start",
                                                        children: [
                                                            /*#__PURE__*/ jsx(Typography, {
                                                                variant: "sigma",
                                                                textColor: "neutral600",
                                                                tag: "dt",
                                                                children: formatMessage({
                                                                    id: 'Settings.application.node-version',
                                                                    defaultMessage: 'node version'
                                                                })
                                                            }),
                                                            /*#__PURE__*/ jsx(Typography, {
                                                                tag: "dd",
                                                                children: nodeVersion
                                                            })
                                                        ]
                                                    }),
                                                    /*#__PURE__*/ jsx(AdminSeatInfo, {}),
                                                    /*#__PURE__*/ jsx(AIUsageData, {})
                                                ]
                                            })
                                        ]
                                    }),
                                    canRead && /*#__PURE__*/ jsxs(Box, {
                                        hasRadius: true,
                                        background: "neutral0",
                                        shadow: "tableShadow",
                                        paddingTop: 6,
                                        paddingBottom: 6,
                                        paddingRight: 7,
                                        paddingLeft: 7,
                                        children: [
                                            /*#__PURE__*/ jsx(Typography, {
                                                variant: "delta",
                                                tag: "h3",
                                                children: formatMessage({
                                                    id: 'Settings.application.customization',
                                                    defaultMessage: 'Customization'
                                                })
                                            }),
                                            /*#__PURE__*/ jsx(Typography, {
                                                variant: "pi",
                                                textColor: "neutral600",
                                                children: formatMessage({
                                                    id: 'Settings.application.customization.size-details',
                                                    defaultMessage: 'Max dimension: {dimension}×{dimension}, Max file size: {size}KB'
                                                }, {
                                                    dimension: DIMENSION,
                                                    size: SIZE
                                                })
                                            }),
                                            /*#__PURE__*/ jsxs(Grid.Root, {
                                                paddingTop: 4,
                                                gap: 4,
                                                children: [
                                                    /*#__PURE__*/ jsx(Grid.Item, {
                                                        col: 6,
                                                        s: 12,
                                                        direction: "column",
                                                        alignItems: "stretch",
                                                        children: /*#__PURE__*/ jsx(LogoInput, {
                                                            canUpdate: canUpdate,
                                                            customLogo: logos.menu.custom,
                                                            defaultLogo: logos.menu.default,
                                                            hint: formatMessage({
                                                                id: 'Settings.application.customization.menu-logo.carousel-hint',
                                                                defaultMessage: 'Replace the logo in the main navigation'
                                                            }),
                                                            label: formatMessage({
                                                                id: 'Settings.application.customization.carousel.menu-logo.title',
                                                                defaultMessage: 'Menu logo'
                                                            }),
                                                            onChangeLogo: handleChangeLogo('menu')
                                                        })
                                                    }),
                                                    /*#__PURE__*/ jsx(Grid.Item, {
                                                        col: 6,
                                                        s: 12,
                                                        direction: "column",
                                                        alignItems: "stretch",
                                                        children: /*#__PURE__*/ jsx(LogoInput, {
                                                            canUpdate: canUpdate,
                                                            customLogo: logos.auth.custom,
                                                            defaultLogo: logos.auth.default,
                                                            hint: formatMessage({
                                                                id: 'Settings.application.customization.auth-logo.carousel-hint',
                                                                defaultMessage: 'Replace the logo in the authentication pages'
                                                            }),
                                                            label: formatMessage({
                                                                id: 'Settings.application.customization.carousel.auth-logo.title',
                                                                defaultMessage: 'Auth logo'
                                                            }),
                                                            onChangeLogo: handleChangeLogo('auth')
                                                        })
                                                    })
                                                ]
                                            })
                                        ]
                                    })
                                ]
                            })
                        })
                    ]
                })
            })
        ]
    });
};

export { ApplicationInfoPage };
//# sourceMappingURL=ApplicationInfoPage.mjs.map
