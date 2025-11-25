'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var symbols = require('@strapi/icons/symbols');
var reactIntl = require('react-intl');
var styled = require('styled-components');
var Layout = require('../../../components/Layouts/Layout.js');
var PageHelpers = require('../../../components/PageHelpers.js');
var NpmPackageCard = require('./NpmPackageCard.js');

const NpmPackagesGrid = ({ status, npmPackages = [], installedPackageNames = [], useYarn, isInDevelopmentMode, npmPackageType, strapiAppVersion, debouncedSearch })=>{
    const { formatMessage } = reactIntl.useIntl();
    if (status === 'error') {
        return /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Error, {});
    }
    if (status === 'loading') {
        return /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Loading, {});
    }
    const emptySearchMessage = formatMessage({
        id: 'admin.pages.MarketPlacePage.search.empty',
        defaultMessage: 'No result for "{target}"'
    }, {
        target: debouncedSearch
    });
    if (npmPackages.length === 0) {
        return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Box, {
            position: "relative",
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(Layout.Layouts.Grid, {
                    size: "M",
                    children: Array(12).fill(null).map((_, idx)=>/*#__PURE__*/ jsxRuntime.jsx(EmptyPluginCard, {
                            height: "234px",
                            hasRadius: true
                        }, idx))
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                    position: "absolute",
                    top: 11,
                    width: "100%",
                    children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                        alignItems: "center",
                        justifyContent: "center",
                        direction: "column",
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(symbols.EmptyDocuments, {
                                width: "160px",
                                height: "88px"
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                paddingTop: 6,
                                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                    variant: "delta",
                                    tag: "p",
                                    textColor: "neutral600",
                                    children: emptySearchMessage
                                })
                            })
                        ]
                    })
                })
            ]
        });
    }
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Root, {
        gap: 4,
        children: npmPackages.map((npmPackage)=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                col: 4,
                s: 6,
                xs: 12,
                style: {
                    height: '100%'
                },
                direction: "column",
                alignItems: "stretch",
                children: /*#__PURE__*/ jsxRuntime.jsx(NpmPackageCard.NpmPackageCard, {
                    npmPackage: npmPackage,
                    isInstalled: installedPackageNames.includes(npmPackage.attributes.npmPackageName),
                    useYarn: useYarn,
                    isInDevelopmentMode: isInDevelopmentMode,
                    npmPackageType: npmPackageType,
                    strapiAppVersion: strapiAppVersion
                })
            }, npmPackage.id))
    });
};
const EmptyPluginCard = styled.styled(designSystem.Box)`
  background: ${({ theme })=>`linear-gradient(180deg, rgba(234, 234, 239, 0) 0%, ${theme.colors.neutral150} 100%)`};
  opacity: 0.33;
`;

exports.NpmPackagesGrid = NpmPackagesGrid;
//# sourceMappingURL=NpmPackagesGrid.js.map
