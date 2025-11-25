'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var symbols = require('@strapi/icons/symbols');
var pluralize = require('pluralize');
var reactIntl = require('react-intl');
var semver = require('semver');
var styled = require('styled-components');
var logoStrapi2022 = require('../../../assets/images/logo-strapi-2022.svg.js');
var Notifications = require('../../../features/Notifications.js');
var Tracking = require('../../../features/Tracking.js');
var useClipboard = require('../../../hooks/useClipboard.js');

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

var semver__namespace = /*#__PURE__*/_interopNamespaceDefault(semver);

// Custom component to have an ellipsis after the 2nd line
const EllipsisText = styled.styled(designSystem.Typography)`
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
`;
const NpmPackageCard = ({ npmPackage, isInstalled, useYarn, isInDevelopmentMode, npmPackageType, strapiAppVersion })=>{
    const { attributes } = npmPackage;
    const { formatMessage } = reactIntl.useIntl();
    const { trackUsage } = Tracking.useTracking();
    const commandToCopy = useYarn ? `yarn add ${attributes.npmPackageName}` : `npm install ${attributes.npmPackageName}`;
    const madeByStrapiMessage = formatMessage({
        id: 'admin.pages.MarketPlacePage.plugin.tooltip.madeByStrapi',
        defaultMessage: 'Made by Strapi'
    });
    const npmPackageHref = `https://market.strapi.io/${pluralize.plural(npmPackageType)}/${attributes.slug}`;
    const versionRange = semver__namespace.validRange(attributes.strapiVersion);
    const isCompatible = versionRange ? semver__namespace.satisfies(strapiAppVersion ?? '', versionRange) : false;
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
        direction: "column",
        justifyContent: "space-between",
        paddingTop: 4,
        paddingRight: 4,
        paddingBottom: 4,
        paddingLeft: 4,
        hasRadius: true,
        background: "neutral0",
        shadow: "tableShadow",
        height: "100%",
        alignItems: "normal",
        "data-testid": "npm-package-card",
        children: [
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Box, {
                children: [
                    /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                        direction: "row",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                tag: "img",
                                src: attributes.logo.url,
                                alt: `${attributes.name} logo`,
                                hasRadius: true,
                                width: 11,
                                height: 11
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(PackageStats, {
                                githubStars: attributes.githubStars,
                                npmDownloads: attributes.npmDownloads,
                                npmPackageType: npmPackageType
                            })
                        ]
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                        paddingTop: 4,
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                            tag: "h3",
                            variant: "delta",
                            children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                alignItems: "center",
                                gap: attributes.validated && !attributes.madeByStrapi ? 2 : 1,
                                children: [
                                    attributes.name,
                                    attributes.validated && !attributes.madeByStrapi && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tooltip, {
                                        description: formatMessage({
                                            id: 'admin.pages.MarketPlacePage.plugin.tooltip.verified',
                                            defaultMessage: 'Plugin verified by Strapi'
                                        }),
                                        children: /*#__PURE__*/ jsxRuntime.jsx(icons.CheckCircle, {
                                            fill: "success600"
                                        })
                                    }),
                                    attributes.madeByStrapi && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tooltip, {
                                        description: madeByStrapiMessage,
                                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                            tag: "img",
                                            src: logoStrapi2022,
                                            alt: madeByStrapiMessage,
                                            width: 6,
                                            height: "auto"
                                        })
                                    })
                                ]
                            })
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                        paddingTop: 2,
                        children: /*#__PURE__*/ jsxRuntime.jsx(EllipsisText, {
                            tag: "p",
                            variant: "omega",
                            textColor: "neutral600",
                            children: attributes.description
                        })
                    })
                ]
            }),
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                gap: 2,
                style: {
                    alignSelf: 'flex-end'
                },
                paddingTop: 6,
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.LinkButton, {
                        size: "S",
                        href: npmPackageHref,
                        isExternal: true,
                        endIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.ExternalLink, {}),
                        "aria-label": formatMessage({
                            id: 'admin.pages.MarketPlacePage.plugin.info.label',
                            defaultMessage: 'Learn more about {pluginName}'
                        }, {
                            pluginName: attributes.name
                        }),
                        variant: "tertiary",
                        onClick: ()=>trackUsage('didPluginLearnMore'),
                        children: formatMessage({
                            id: 'admin.pages.MarketPlacePage.plugin.info.text',
                            defaultMessage: 'More'
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(InstallPluginButton, {
                        isInstalled: isInstalled,
                        isInDevelopmentMode: isInDevelopmentMode,
                        isCompatible: isCompatible,
                        commandToCopy: commandToCopy,
                        strapiAppVersion: strapiAppVersion,
                        strapiPeerDepVersion: attributes.strapiVersion,
                        pluginName: attributes.name
                    })
                ]
            })
        ]
    });
};
const InstallPluginButton = ({ isInstalled, isInDevelopmentMode, isCompatible, commandToCopy, strapiAppVersion, strapiPeerDepVersion, pluginName })=>{
    const { toggleNotification } = Notifications.useNotification();
    const { formatMessage } = reactIntl.useIntl();
    const { trackUsage } = Tracking.useTracking();
    const { copy } = useClipboard.useClipboard();
    const handleCopy = async ()=>{
        const didCopy = await copy(commandToCopy);
        if (didCopy) {
            trackUsage('willInstallPlugin');
            toggleNotification({
                type: 'success',
                message: formatMessage({
                    id: 'admin.pages.MarketPlacePage.plugin.copy.success'
                })
            });
        }
    };
    // Already installed
    if (isInstalled) {
        return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
            gap: 2,
            paddingLeft: 4,
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(icons.Check, {
                    width: "1.2rem",
                    height: "1.2rem",
                    color: "success600"
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                    variant: "omega",
                    textColor: "success600",
                    fontWeight: "bold",
                    children: formatMessage({
                        id: 'admin.pages.MarketPlacePage.plugin.installed',
                        defaultMessage: 'Installed'
                    })
                })
            ]
        });
    }
    // In development, show install button
    if (isInDevelopmentMode && isCompatible !== false) {
        return /*#__PURE__*/ jsxRuntime.jsx(CardButton, {
            strapiAppVersion: strapiAppVersion,
            strapiPeerDepVersion: strapiPeerDepVersion,
            handleCopy: handleCopy,
            pluginName: pluginName
        });
    }
    // Not in development and plugin not installed already. Show nothing
    return null;
};
const CardButton = ({ strapiPeerDepVersion, strapiAppVersion, handleCopy, pluginName })=>{
    const { formatMessage } = reactIntl.useIntl();
    const versionRange = semver__namespace.validRange(strapiPeerDepVersion);
    const isCompatible = semver__namespace.satisfies(strapiAppVersion ?? '', versionRange ?? '');
    const installMessage = formatMessage({
        id: 'admin.pages.MarketPlacePage.plugin.copy',
        defaultMessage: 'Copy install command'
    });
    // Only plugins receive a strapiAppVersion
    if (strapiAppVersion) {
        if (!versionRange || !isCompatible) {
            return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tooltip, {
                "data-testid": `tooltip-${pluginName}`,
                label: formatMessage({
                    id: 'admin.pages.MarketPlacePage.plugin.version',
                    defaultMessage: 'Update your Strapi version: "{strapiAppVersion}" to: "{versionRange}"'
                }, {
                    strapiAppVersion,
                    versionRange
                }),
                children: /*#__PURE__*/ jsxRuntime.jsx("span", {
                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                        size: "S",
                        startIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.Duplicate, {}),
                        variant: "secondary",
                        onClick: handleCopy,
                        disabled: !isCompatible,
                        children: installMessage
                    })
                })
            });
        }
    }
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
        size: "S",
        startIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.Duplicate, {}),
        variant: "secondary",
        onClick: handleCopy,
        children: installMessage
    });
};
const PackageStats = ({ githubStars = 0, npmDownloads = 0, npmPackageType })=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
        gap: 1,
        children: [
            !!githubStars && /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(symbols.GitHub, {
                        height: "1.2rem",
                        width: "1.2rem",
                        "aria-hidden": true
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(icons.Star, {
                        height: "1.2rem",
                        width: "1.2rem",
                        fill: "warning500",
                        "aria-hidden": true
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx("p", {
                        "aria-label": formatMessage({
                            id: `admin.pages.MarketPlacePage.${npmPackageType}.githubStars`,
                            defaultMessage: `This {package} was starred {starsCount} on GitHub`
                        }, {
                            starsCount: githubStars,
                            package: npmPackageType
                        }),
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                            variant: "pi",
                            textColor: "neutral800",
                            children: githubStars
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(VerticalDivider, {})
                ]
            }),
            /*#__PURE__*/ jsxRuntime.jsx(icons.Download, {
                height: "1.2rem",
                width: "1.2rem",
                "aria-hidden": true
            }),
            /*#__PURE__*/ jsxRuntime.jsx("p", {
                "aria-label": formatMessage({
                    id: `admin.pages.MarketPlacePage.${npmPackageType}.downloads`,
                    defaultMessage: `This {package} has {downloadsCount} weekly downloads`
                }, {
                    downloadsCount: npmDownloads,
                    package: npmPackageType
                }),
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                    variant: "pi",
                    textColor: "neutral800",
                    children: npmDownloads
                })
            })
        ]
    });
};
const VerticalDivider = styled.styled(designSystem.Divider)`
  width: 1.2rem;
  transform: rotate(90deg);
`;

exports.NpmPackageCard = NpmPackageCard;
//# sourceMappingURL=NpmPackageCard.js.map
