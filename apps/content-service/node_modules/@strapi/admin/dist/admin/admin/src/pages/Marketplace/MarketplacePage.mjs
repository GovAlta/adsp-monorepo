import { jsx, jsxs } from 'react/jsx-runtime';
import * as React from 'react';
import { Tabs, Flex, Box, Searchbar } from '@strapi/design-system';
import { ExternalLink } from '@strapi/icons';
import { GlassesSquare } from '@strapi/icons/symbols';
import { useIntl } from 'react-intl';
import { ContentBox } from '../../components/ContentBox.mjs';
import { Layouts } from '../../components/Layouts/Layout.mjs';
import { Page } from '../../components/PageHelpers.mjs';
import { Pagination } from '../../components/Pagination.mjs';
import { useTypedSelector } from '../../core/store/hooks.mjs';
import { useAppInfo } from '../../features/AppInfo.mjs';
import { useNotification } from '../../features/Notifications.mjs';
import { useTracking } from '../../features/Tracking.mjs';
import { useDebounce } from '../../hooks/useDebounce.mjs';
import { useQueryParams } from '../../hooks/useQueryParams.mjs';
import { NpmPackagesFilters } from './components/NpmPackagesFilters.mjs';
import { NpmPackagesGrid } from './components/NpmPackagesGrid.mjs';
import { OfflineLayout } from './components/OfflineLayout.mjs';
import { PageHeader } from './components/PageHeader.mjs';
import { SortSelect } from './components/SortSelect.mjs';
import { useMarketplaceData } from './hooks/useMarketplaceData.mjs';
import { useNavigatorOnline } from './hooks/useNavigatorOnline.mjs';

const PLUGIN = 'plugin';
const PROVIDER = 'provider';
const MarketplacePage = ()=>{
    const { formatMessage } = useIntl();
    const { trackUsage } = useTracking();
    const { toggleNotification } = useNotification();
    const [{ query }, setQuery] = useQueryParams();
    const debouncedSearch = useDebounce(query?.search, 500) || '';
    const { autoReload: isInDevelopmentMode, dependencies, useYarn, strapiVersion } = useAppInfo('MarketplacePage', (state)=>state);
    const isOnline = useNavigatorOnline();
    const npmPackageType = query?.npmPackageType || PLUGIN;
    const [tabQuery, setTabQuery] = React.useState({
        plugin: npmPackageType === PLUGIN ? {
            ...query
        } : {},
        provider: npmPackageType === PROVIDER ? {
            ...query
        } : {}
    });
    React.useEffect(()=>{
        trackUsage('didGoToMarketplace');
    }, [
        trackUsage
    ]);
    React.useEffect(()=>{
        if (!isInDevelopmentMode) {
            toggleNotification({
                type: 'info',
                message: formatMessage({
                    id: 'admin.pages.MarketPlacePage.production',
                    defaultMessage: 'Manage plugins from the development environment'
                })
            });
        }
    }, [
        toggleNotification,
        isInDevelopmentMode,
        formatMessage
    ]);
    const { pluginsResponse, providersResponse, pluginsStatus, providersStatus, possibleCollections, possibleCategories, pagination } = useMarketplaceData({
        npmPackageType,
        debouncedSearch,
        query,
        tabQuery,
        strapiVersion
    });
    if (!isOnline) {
        return /*#__PURE__*/ jsx(OfflineLayout, {});
    }
    const handleTabChange = (tab)=>{
        const selectedTab = tab === PLUGIN || tab === PROVIDER ? tab : PLUGIN;
        const hasTabQuery = tabQuery[selectedTab] && Object.keys(tabQuery[selectedTab]).length;
        if (hasTabQuery) {
            setQuery({
                // Keep filters and search
                ...tabQuery[selectedTab],
                search: query?.search || '',
                // Set tab and reset page
                npmPackageType: selectedTab,
                page: 1
            });
        } else {
            setQuery({
                // Set tab
                npmPackageType: selectedTab,
                // Clear filters
                collections: [],
                categories: [],
                sort: 'name:asc',
                page: 1,
                // Keep search
                search: query?.search || ''
            });
        }
    };
    const handleSelectChange = (update)=>{
        setQuery({
            ...update,
            page: 1
        });
        setTabQuery((prev)=>({
                ...prev,
                [npmPackageType]: {
                    ...prev[npmPackageType],
                    ...update
                }
            }));
    };
    const handleSelectClear = (filterType)=>{
        setQuery({
            [filterType]: [],
            page: undefined
        }, 'remove');
        setTabQuery((prev)=>({
                ...prev,
                [npmPackageType]: {}
            }));
    };
    const handleSortSelectChange = ({ sort })=>// @ts-expect-error - this is a narrowing issue.
        handleSelectChange({
            sort
        });
    // Check if plugins and providers are installed already
    const installedPackageNames = Object.keys(dependencies ?? {});
    return /*#__PURE__*/ jsx(Layouts.Root, {
        children: /*#__PURE__*/ jsxs(Page.Main, {
            children: [
                /*#__PURE__*/ jsx(Page.Title, {
                    children: formatMessage({
                        id: 'admin.pages.MarketPlacePage.head',
                        defaultMessage: 'Marketplace - Plugins'
                    })
                }),
                /*#__PURE__*/ jsx(PageHeader, {
                    isOnline: isOnline,
                    npmPackageType: npmPackageType
                }),
                /*#__PURE__*/ jsx(Layouts.Content, {
                    children: /*#__PURE__*/ jsxs(Tabs.Root, {
                        variant: "simple",
                        onValueChange: handleTabChange,
                        value: npmPackageType,
                        children: [
                            /*#__PURE__*/ jsxs(Flex, {
                                justifyContent: "space-between",
                                paddingBottom: 4,
                                children: [
                                    /*#__PURE__*/ jsxs(Tabs.List, {
                                        "aria-label": formatMessage({
                                            id: 'admin.pages.MarketPlacePage.tab-group.label',
                                            defaultMessage: 'Plugins and Providers for Strapi'
                                        }),
                                        children: [
                                            /*#__PURE__*/ jsxs(Tabs.Trigger, {
                                                value: PLUGIN,
                                                children: [
                                                    formatMessage({
                                                        id: 'admin.pages.MarketPlacePage.plugins',
                                                        defaultMessage: 'Plugins'
                                                    }),
                                                    ' ',
                                                    pluginsResponse ? `(${pluginsResponse.meta.pagination.total})` : '...'
                                                ]
                                            }),
                                            /*#__PURE__*/ jsxs(Tabs.Trigger, {
                                                value: PROVIDER,
                                                children: [
                                                    formatMessage({
                                                        id: 'admin.pages.MarketPlacePage.providers',
                                                        defaultMessage: 'Providers'
                                                    }),
                                                    ' ',
                                                    providersResponse ? `(${providersResponse.meta.pagination.total})` : '...'
                                                ]
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ jsx(Box, {
                                        width: "25%",
                                        children: /*#__PURE__*/ jsx(Searchbar, {
                                            name: "searchbar",
                                            onClear: ()=>setQuery({
                                                    search: '',
                                                    page: 1
                                                }),
                                            value: query?.search,
                                            onChange: (e)=>setQuery({
                                                    search: e.target.value,
                                                    page: 1
                                                }),
                                            clearLabel: formatMessage({
                                                id: 'admin.pages.MarketPlacePage.search.clear',
                                                defaultMessage: 'Clear the search'
                                            }),
                                            placeholder: formatMessage({
                                                id: 'admin.pages.MarketPlacePage.search.placeholder',
                                                defaultMessage: 'Search'
                                            }),
                                            children: formatMessage({
                                                id: 'admin.pages.MarketPlacePage.search.placeholder',
                                                defaultMessage: 'Search'
                                            })
                                        })
                                    })
                                ]
                            }),
                            /*#__PURE__*/ jsxs(Flex, {
                                paddingBottom: 4,
                                gap: 2,
                                children: [
                                    /*#__PURE__*/ jsx(SortSelect, {
                                        sortQuery: query?.sort || 'name:asc',
                                        handleSelectChange: handleSortSelectChange
                                    }),
                                    /*#__PURE__*/ jsx(NpmPackagesFilters, {
                                        npmPackageType: npmPackageType,
                                        possibleCollections: possibleCollections,
                                        possibleCategories: possibleCategories,
                                        query: query || {},
                                        handleSelectChange: handleSelectChange,
                                        handleSelectClear: handleSelectClear
                                    })
                                ]
                            }),
                            /*#__PURE__*/ jsx(Tabs.Content, {
                                value: PLUGIN,
                                children: /*#__PURE__*/ jsx(NpmPackagesGrid, {
                                    npmPackages: pluginsResponse?.data,
                                    status: pluginsStatus,
                                    installedPackageNames: installedPackageNames,
                                    useYarn: useYarn,
                                    isInDevelopmentMode: isInDevelopmentMode,
                                    npmPackageType: "plugin",
                                    strapiAppVersion: strapiVersion,
                                    debouncedSearch: debouncedSearch
                                })
                            }),
                            /*#__PURE__*/ jsx(Tabs.Content, {
                                value: PROVIDER,
                                children: /*#__PURE__*/ jsx(NpmPackagesGrid, {
                                    npmPackages: providersResponse?.data,
                                    status: providersStatus,
                                    installedPackageNames: installedPackageNames,
                                    useYarn: useYarn,
                                    isInDevelopmentMode: isInDevelopmentMode,
                                    npmPackageType: "provider",
                                    debouncedSearch: debouncedSearch
                                })
                            }),
                            /*#__PURE__*/ jsxs(Pagination.Root, {
                                ...pagination,
                                defaultPageSize: 24,
                                children: [
                                    /*#__PURE__*/ jsx(Pagination.PageSize, {
                                        options: [
                                            '12',
                                            '24',
                                            '50',
                                            '100'
                                        ]
                                    }),
                                    /*#__PURE__*/ jsx(Pagination.Links, {})
                                ]
                            }),
                            /*#__PURE__*/ jsx(Box, {
                                paddingTop: 8,
                                children: /*#__PURE__*/ jsx("a", {
                                    href: "https://strapi.canny.io/plugin-requests",
                                    target: "_blank",
                                    rel: "noopener noreferrer nofollow",
                                    style: {
                                        textDecoration: 'none'
                                    },
                                    onClick: ()=>trackUsage('didMissMarketplacePlugin'),
                                    children: /*#__PURE__*/ jsx(ContentBox, {
                                        title: formatMessage({
                                            id: 'admin.pages.MarketPlacePage.missingPlugin.title',
                                            defaultMessage: 'Documentation'
                                        }),
                                        subtitle: formatMessage({
                                            id: 'admin.pages.MarketPlacePage.missingPlugin.description',
                                            defaultMessage: "Tell us what plugin you are looking for and we'll let our community plugin developers know in case they are in search for inspiration!"
                                        }),
                                        icon: /*#__PURE__*/ jsx(GlassesSquare, {}),
                                        iconBackground: "alternative100",
                                        endAction: /*#__PURE__*/ jsx(ExternalLink, {
                                            fill: "neutral600",
                                            width: "1.2rem",
                                            height: "1.2rem",
                                            style: {
                                                marginLeft: '0.8rem'
                                            }
                                        })
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
const ProtectedMarketplacePage = ()=>{
    const permissions = useTypedSelector((state)=>state.admin_app.permissions.marketplace?.main);
    return /*#__PURE__*/ jsx(Page.Protect, {
        permissions: permissions,
        children: /*#__PURE__*/ jsx(MarketplacePage, {})
    });
};

export { MarketplacePage, ProtectedMarketplacePage };
//# sourceMappingURL=MarketplacePage.mjs.map
