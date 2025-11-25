import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import { Typography, Divider, Flex, Box, Tooltip, LinkButton, Button } from '@strapi/design-system';
import { CheckCircle, ExternalLink, Check, Duplicate, Star, Download } from '@strapi/icons';
import { GitHub } from '@strapi/icons/symbols';
import pluralize from 'pluralize';
import { useIntl } from 'react-intl';
import * as semver from 'semver';
import { styled } from 'styled-components';
import img from '../../../assets/images/logo-strapi-2022.svg.mjs';
import { useNotification } from '../../../features/Notifications.mjs';
import { useTracking } from '../../../features/Tracking.mjs';
import { useClipboard } from '../../../hooks/useClipboard.mjs';

// Custom component to have an ellipsis after the 2nd line
const EllipsisText = styled(Typography)`
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
`;
const NpmPackageCard = ({ npmPackage, isInstalled, useYarn, isInDevelopmentMode, npmPackageType, strapiAppVersion })=>{
    const { attributes } = npmPackage;
    const { formatMessage } = useIntl();
    const { trackUsage } = useTracking();
    const commandToCopy = useYarn ? `yarn add ${attributes.npmPackageName}` : `npm install ${attributes.npmPackageName}`;
    const madeByStrapiMessage = formatMessage({
        id: 'admin.pages.MarketPlacePage.plugin.tooltip.madeByStrapi',
        defaultMessage: 'Made by Strapi'
    });
    const npmPackageHref = `https://market.strapi.io/${pluralize.plural(npmPackageType)}/${attributes.slug}`;
    const versionRange = semver.validRange(attributes.strapiVersion);
    const isCompatible = versionRange ? semver.satisfies(strapiAppVersion ?? '', versionRange) : false;
    return /*#__PURE__*/ jsxs(Flex, {
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
            /*#__PURE__*/ jsxs(Box, {
                children: [
                    /*#__PURE__*/ jsxs(Flex, {
                        direction: "row",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        children: [
                            /*#__PURE__*/ jsx(Box, {
                                tag: "img",
                                src: attributes.logo.url,
                                alt: `${attributes.name} logo`,
                                hasRadius: true,
                                width: 11,
                                height: 11
                            }),
                            /*#__PURE__*/ jsx(PackageStats, {
                                githubStars: attributes.githubStars,
                                npmDownloads: attributes.npmDownloads,
                                npmPackageType: npmPackageType
                            })
                        ]
                    }),
                    /*#__PURE__*/ jsx(Box, {
                        paddingTop: 4,
                        children: /*#__PURE__*/ jsx(Typography, {
                            tag: "h3",
                            variant: "delta",
                            children: /*#__PURE__*/ jsxs(Flex, {
                                alignItems: "center",
                                gap: attributes.validated && !attributes.madeByStrapi ? 2 : 1,
                                children: [
                                    attributes.name,
                                    attributes.validated && !attributes.madeByStrapi && /*#__PURE__*/ jsx(Tooltip, {
                                        description: formatMessage({
                                            id: 'admin.pages.MarketPlacePage.plugin.tooltip.verified',
                                            defaultMessage: 'Plugin verified by Strapi'
                                        }),
                                        children: /*#__PURE__*/ jsx(CheckCircle, {
                                            fill: "success600"
                                        })
                                    }),
                                    attributes.madeByStrapi && /*#__PURE__*/ jsx(Tooltip, {
                                        description: madeByStrapiMessage,
                                        children: /*#__PURE__*/ jsx(Box, {
                                            tag: "img",
                                            src: img,
                                            alt: madeByStrapiMessage,
                                            width: 6,
                                            height: "auto"
                                        })
                                    })
                                ]
                            })
                        })
                    }),
                    /*#__PURE__*/ jsx(Box, {
                        paddingTop: 2,
                        children: /*#__PURE__*/ jsx(EllipsisText, {
                            tag: "p",
                            variant: "omega",
                            textColor: "neutral600",
                            children: attributes.description
                        })
                    })
                ]
            }),
            /*#__PURE__*/ jsxs(Flex, {
                gap: 2,
                style: {
                    alignSelf: 'flex-end'
                },
                paddingTop: 6,
                children: [
                    /*#__PURE__*/ jsx(LinkButton, {
                        size: "S",
                        href: npmPackageHref,
                        isExternal: true,
                        endIcon: /*#__PURE__*/ jsx(ExternalLink, {}),
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
                    /*#__PURE__*/ jsx(InstallPluginButton, {
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
    const { toggleNotification } = useNotification();
    const { formatMessage } = useIntl();
    const { trackUsage } = useTracking();
    const { copy } = useClipboard();
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
        return /*#__PURE__*/ jsxs(Flex, {
            gap: 2,
            paddingLeft: 4,
            children: [
                /*#__PURE__*/ jsx(Check, {
                    width: "1.2rem",
                    height: "1.2rem",
                    color: "success600"
                }),
                /*#__PURE__*/ jsx(Typography, {
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
        return /*#__PURE__*/ jsx(CardButton, {
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
    const { formatMessage } = useIntl();
    const versionRange = semver.validRange(strapiPeerDepVersion);
    const isCompatible = semver.satisfies(strapiAppVersion ?? '', versionRange ?? '');
    const installMessage = formatMessage({
        id: 'admin.pages.MarketPlacePage.plugin.copy',
        defaultMessage: 'Copy install command'
    });
    // Only plugins receive a strapiAppVersion
    if (strapiAppVersion) {
        if (!versionRange || !isCompatible) {
            return /*#__PURE__*/ jsx(Tooltip, {
                "data-testid": `tooltip-${pluginName}`,
                label: formatMessage({
                    id: 'admin.pages.MarketPlacePage.plugin.version',
                    defaultMessage: 'Update your Strapi version: "{strapiAppVersion}" to: "{versionRange}"'
                }, {
                    strapiAppVersion,
                    versionRange
                }),
                children: /*#__PURE__*/ jsx("span", {
                    children: /*#__PURE__*/ jsx(Button, {
                        size: "S",
                        startIcon: /*#__PURE__*/ jsx(Duplicate, {}),
                        variant: "secondary",
                        onClick: handleCopy,
                        disabled: !isCompatible,
                        children: installMessage
                    })
                })
            });
        }
    }
    return /*#__PURE__*/ jsx(Button, {
        size: "S",
        startIcon: /*#__PURE__*/ jsx(Duplicate, {}),
        variant: "secondary",
        onClick: handleCopy,
        children: installMessage
    });
};
const PackageStats = ({ githubStars = 0, npmDownloads = 0, npmPackageType })=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsxs(Flex, {
        gap: 1,
        children: [
            !!githubStars && /*#__PURE__*/ jsxs(Fragment, {
                children: [
                    /*#__PURE__*/ jsx(GitHub, {
                        height: "1.2rem",
                        width: "1.2rem",
                        "aria-hidden": true
                    }),
                    /*#__PURE__*/ jsx(Star, {
                        height: "1.2rem",
                        width: "1.2rem",
                        fill: "warning500",
                        "aria-hidden": true
                    }),
                    /*#__PURE__*/ jsx("p", {
                        "aria-label": formatMessage({
                            id: `admin.pages.MarketPlacePage.${npmPackageType}.githubStars`,
                            defaultMessage: `This {package} was starred {starsCount} on GitHub`
                        }, {
                            starsCount: githubStars,
                            package: npmPackageType
                        }),
                        children: /*#__PURE__*/ jsx(Typography, {
                            variant: "pi",
                            textColor: "neutral800",
                            children: githubStars
                        })
                    }),
                    /*#__PURE__*/ jsx(VerticalDivider, {})
                ]
            }),
            /*#__PURE__*/ jsx(Download, {
                height: "1.2rem",
                width: "1.2rem",
                "aria-hidden": true
            }),
            /*#__PURE__*/ jsx("p", {
                "aria-label": formatMessage({
                    id: `admin.pages.MarketPlacePage.${npmPackageType}.downloads`,
                    defaultMessage: `This {package} has {downloadsCount} weekly downloads`
                }, {
                    downloadsCount: npmDownloads,
                    package: npmPackageType
                }),
                children: /*#__PURE__*/ jsx(Typography, {
                    variant: "pi",
                    textColor: "neutral800",
                    children: npmDownloads
                })
            })
        ]
    });
};
const VerticalDivider = styled(Divider)`
  width: 1.2rem;
  transform: rotate(90deg);
`;

export { NpmPackageCard };
//# sourceMappingURL=NpmPackageCard.mjs.map
