import { jsx, jsxs } from 'react/jsx-runtime';
import { Box, Flex, Typography, Grid } from '@strapi/design-system';
import { EmptyDocuments } from '@strapi/icons/symbols';
import { useIntl } from 'react-intl';
import { styled } from 'styled-components';
import { Layouts } from '../../../components/Layouts/Layout.mjs';
import { Page } from '../../../components/PageHelpers.mjs';
import { NpmPackageCard } from './NpmPackageCard.mjs';

const NpmPackagesGrid = ({ status, npmPackages = [], installedPackageNames = [], useYarn, isInDevelopmentMode, npmPackageType, strapiAppVersion, debouncedSearch })=>{
    const { formatMessage } = useIntl();
    if (status === 'error') {
        return /*#__PURE__*/ jsx(Page.Error, {});
    }
    if (status === 'loading') {
        return /*#__PURE__*/ jsx(Page.Loading, {});
    }
    const emptySearchMessage = formatMessage({
        id: 'admin.pages.MarketPlacePage.search.empty',
        defaultMessage: 'No result for "{target}"'
    }, {
        target: debouncedSearch
    });
    if (npmPackages.length === 0) {
        return /*#__PURE__*/ jsxs(Box, {
            position: "relative",
            children: [
                /*#__PURE__*/ jsx(Layouts.Grid, {
                    size: "M",
                    children: Array(12).fill(null).map((_, idx)=>/*#__PURE__*/ jsx(EmptyPluginCard, {
                            height: "234px",
                            hasRadius: true
                        }, idx))
                }),
                /*#__PURE__*/ jsx(Box, {
                    position: "absolute",
                    top: 11,
                    width: "100%",
                    children: /*#__PURE__*/ jsxs(Flex, {
                        alignItems: "center",
                        justifyContent: "center",
                        direction: "column",
                        children: [
                            /*#__PURE__*/ jsx(EmptyDocuments, {
                                width: "160px",
                                height: "88px"
                            }),
                            /*#__PURE__*/ jsx(Box, {
                                paddingTop: 6,
                                children: /*#__PURE__*/ jsx(Typography, {
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
    return /*#__PURE__*/ jsx(Grid.Root, {
        gap: 4,
        children: npmPackages.map((npmPackage)=>/*#__PURE__*/ jsx(Grid.Item, {
                col: 4,
                s: 6,
                xs: 12,
                style: {
                    height: '100%'
                },
                direction: "column",
                alignItems: "stretch",
                children: /*#__PURE__*/ jsx(NpmPackageCard, {
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
const EmptyPluginCard = styled(Box)`
  background: ${({ theme })=>`linear-gradient(180deg, rgba(234, 234, 239, 0) 0%, ${theme.colors.neutral150} 100%)`};
  opacity: 0.33;
`;

export { NpmPackagesGrid };
//# sourceMappingURL=NpmPackagesGrid.mjs.map
