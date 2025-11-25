'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var reactRedux = require('react-redux');
var Layout = require('../../../../components/Layouts/Layout.js');
var PageHelpers = require('../../../../components/PageHelpers.js');
var AppInfo = require('../../../../features/AppInfo.js');
var Configuration = require('../../../../features/Configuration.js');
var Tracking = require('../../../../features/Tracking.js');
var useEnterprise = require('../../../../hooks/useEnterprise.js');
var useFetchClient = require('../../../../hooks/useFetchClient.js');
var useRBAC = require('../../../../hooks/useRBAC.js');
var selectors = require('../../../../selectors.js');
var LogoInput = require('./components/LogoInput.js');
var constants = require('./utils/constants.js');

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

const AdminSeatInfoCE = ()=>null;
const AIUageDataCE = ()=>null;
/* -------------------------------------------------------------------------------------------------
 * ApplicationInfoPage
 * -----------------------------------------------------------------------------------------------*/ const ApplicationInfoPage = ()=>{
    const { trackUsage } = Tracking.useTracking();
    const { formatMessage } = reactIntl.useIntl();
    useFetchClient.useFetchClient();
    const { logos: serverLogos, updateProjectSettings } = Configuration.useConfiguration('ApplicationInfoPage');
    const [logos, setLogos] = React__namespace.useState({
        menu: serverLogos.menu,
        auth: serverLogos.auth
    });
    const { settings } = reactRedux.useSelector(selectors.selectAdminPermissions);
    const communityEdition = AppInfo.useAppInfo('ApplicationInfoPage', (state)=>state.communityEdition);
    const latestStrapiReleaseTag = AppInfo.useAppInfo('ApplicationInfoPage', (state)=>state.latestStrapiReleaseTag);
    const nodeVersion = AppInfo.useAppInfo('ApplicationInfoPage', (state)=>state.nodeVersion);
    const shouldUpdateStrapi = AppInfo.useAppInfo('ApplicationInfoPage', (state)=>state.shouldUpdateStrapi);
    const strapiVersion = AppInfo.useAppInfo('ApplicationInfoPage', (state)=>state.strapiVersion);
    const AdminSeatInfo = useEnterprise.useEnterprise(AdminSeatInfoCE, async ()=>(await Promise.resolve().then(function () { return require('../../../../../../ee/admin/src/pages/SettingsPage/pages/ApplicationInfoPage/components/AdminSeatInfo.js'); })).AdminSeatInfoEE);
    const isAiEnabled = window.strapi.ai?.enabled !== false;
    const AIUsageData = useEnterprise.useEnterprise(AIUageDataCE, async ()=>(await Promise.resolve().then(function () { return require('../../../../../../ee/admin/src/pages/SettingsPage/pages/ApplicationInfoPage/components/AIUsage.js'); })).AIUsage, {
        enabled: isAiEnabled
    });
    const { allowedActions: { canRead, canUpdate } } = useRBAC.useRBAC(settings ? settings['project-settings'] : {});
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
    React__namespace.useEffect(()=>{
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
    return /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Title, {
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
            /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Main, {
                children: /*#__PURE__*/ jsxRuntime.jsxs("form", {
                    onSubmit: handleSubmit,
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(Layout.Layouts.Header, {
                            title: formatMessage({
                                id: 'Settings.application.title',
                                defaultMessage: 'Overview'
                            }),
                            subtitle: formatMessage({
                                id: 'Settings.application.description',
                                defaultMessage: 'Administration panel’s global information'
                            }),
                            primaryAction: canUpdate && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                disabled: isSaveDisabled,
                                type: "submit",
                                startIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.Check, {}),
                                children: formatMessage({
                                    id: 'global.save',
                                    defaultMessage: 'Save'
                                })
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(Layout.Layouts.Content, {
                            children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                direction: "column",
                                alignItems: "stretch",
                                gap: 6,
                                children: [
                                    /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
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
                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                variant: "delta",
                                                tag: "h3",
                                                children: formatMessage({
                                                    id: 'global.details',
                                                    defaultMessage: 'Details'
                                                })
                                            }),
                                            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Grid.Root, {
                                                gap: 5,
                                                tag: "dl",
                                                children: [
                                                    /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Grid.Item, {
                                                        col: 6,
                                                        s: 12,
                                                        direction: "column",
                                                        alignItems: "start",
                                                        children: [
                                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                                variant: "sigma",
                                                                textColor: "neutral600",
                                                                tag: "dt",
                                                                children: formatMessage({
                                                                    id: 'Settings.application.strapiVersion',
                                                                    defaultMessage: 'strapi version'
                                                                })
                                                            }),
                                                            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                                                gap: 3,
                                                                direction: "column",
                                                                alignItems: "start",
                                                                tag: "dd",
                                                                children: [
                                                                    /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Typography, {
                                                                        children: [
                                                                            "v",
                                                                            strapiVersion
                                                                        ]
                                                                    }),
                                                                    shouldUpdateStrapi && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Link, {
                                                                        href: `https://github.com/strapi/strapi/releases/tag/${latestStrapiReleaseTag}`,
                                                                        endIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.ExternalLink, {}),
                                                                        children: formatMessage({
                                                                            id: 'Settings.application.link-upgrade',
                                                                            defaultMessage: 'Upgrade your admin panel'
                                                                        })
                                                                    })
                                                                ]
                                                            })
                                                        ]
                                                    }),
                                                    /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Grid.Item, {
                                                        col: 6,
                                                        s: 12,
                                                        direction: "column",
                                                        alignItems: "start",
                                                        children: [
                                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                                variant: "sigma",
                                                                textColor: "neutral600",
                                                                tag: "dt",
                                                                children: formatMessage({
                                                                    id: 'Settings.application.edition-title',
                                                                    defaultMessage: 'current edition'
                                                                })
                                                            }),
                                                            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                                                gap: 3,
                                                                direction: "column",
                                                                alignItems: "start",
                                                                tag: "dd",
                                                                children: [
                                                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                                        children: formatMessage({
                                                                            id: 'Settings.application.ee-or-ce',
                                                                            defaultMessage: '{communityEdition, select, true {Community Edition} other {Enterprise Edition}}'
                                                                        }, {
                                                                            communityEdition
                                                                        })
                                                                    }),
                                                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Link, {
                                                                        href: "https://strapi.io/pricing-self-hosted",
                                                                        endIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.ExternalLink, {}),
                                                                        children: formatMessage({
                                                                            id: 'Settings.application.link-pricing',
                                                                            defaultMessage: 'See all pricing plans'
                                                                        })
                                                                    })
                                                                ]
                                                            })
                                                        ]
                                                    }),
                                                    /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Grid.Item, {
                                                        col: 6,
                                                        s: 12,
                                                        direction: "column",
                                                        alignItems: "start",
                                                        children: [
                                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                                variant: "sigma",
                                                                textColor: "neutral600",
                                                                tag: "dt",
                                                                children: formatMessage({
                                                                    id: 'Settings.application.node-version',
                                                                    defaultMessage: 'node version'
                                                                })
                                                            }),
                                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                                tag: "dd",
                                                                children: nodeVersion
                                                            })
                                                        ]
                                                    }),
                                                    /*#__PURE__*/ jsxRuntime.jsx(AdminSeatInfo, {}),
                                                    /*#__PURE__*/ jsxRuntime.jsx(AIUsageData, {})
                                                ]
                                            })
                                        ]
                                    }),
                                    canRead && /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Box, {
                                        hasRadius: true,
                                        background: "neutral0",
                                        shadow: "tableShadow",
                                        paddingTop: 6,
                                        paddingBottom: 6,
                                        paddingRight: 7,
                                        paddingLeft: 7,
                                        children: [
                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                variant: "delta",
                                                tag: "h3",
                                                children: formatMessage({
                                                    id: 'Settings.application.customization',
                                                    defaultMessage: 'Customization'
                                                })
                                            }),
                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                variant: "pi",
                                                textColor: "neutral600",
                                                children: formatMessage({
                                                    id: 'Settings.application.customization.size-details',
                                                    defaultMessage: 'Max dimension: {dimension}×{dimension}, Max file size: {size}KB'
                                                }, {
                                                    dimension: constants.DIMENSION,
                                                    size: constants.SIZE
                                                })
                                            }),
                                            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Grid.Root, {
                                                paddingTop: 4,
                                                gap: 4,
                                                children: [
                                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                                                        col: 6,
                                                        s: 12,
                                                        direction: "column",
                                                        alignItems: "stretch",
                                                        children: /*#__PURE__*/ jsxRuntime.jsx(LogoInput.LogoInput, {
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
                                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                                                        col: 6,
                                                        s: 12,
                                                        direction: "column",
                                                        alignItems: "stretch",
                                                        children: /*#__PURE__*/ jsxRuntime.jsx(LogoInput.LogoInput, {
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

exports.ApplicationInfoPage = ApplicationInfoPage;
//# sourceMappingURL=ApplicationInfoPage.js.map
