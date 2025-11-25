'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var symbols = require('@strapi/icons/symbols');
var reactIntl = require('react-intl');
var ContentBox = require('../../components/ContentBox.js');
var Layout = require('../../components/Layouts/Layout.js');
var PageHelpers = require('../../components/PageHelpers.js');
var Pagination = require('../../components/Pagination.js');
var hooks = require('../../core/store/hooks.js');
var AppInfo = require('../../features/AppInfo.js');
var Notifications = require('../../features/Notifications.js');
var Tracking = require('../../features/Tracking.js');
var useDebounce = require('../../hooks/useDebounce.js');
var useQueryParams = require('../../hooks/useQueryParams.js');
var NpmPackagesFilters = require('./components/NpmPackagesFilters.js');
var NpmPackagesGrid = require('./components/NpmPackagesGrid.js');
var OfflineLayout = require('./components/OfflineLayout.js');
var PageHeader = require('./components/PageHeader.js');
var SortSelect = require('./components/SortSelect.js');
var useMarketplaceData = require('./hooks/useMarketplaceData.js');
var useNavigatorOnline = require('./hooks/useNavigatorOnline.js');

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

const PLUGIN = 'plugin';
const PROVIDER = 'provider';
const MarketplacePage = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    const { trackUsage } = Tracking.useTracking();
    const { toggleNotification } = Notifications.useNotification();
    const [{ query }, setQuery] = useQueryParams.useQueryParams();
    const debouncedSearch = useDebounce.useDebounce(query?.search, 500) || '';
    const { autoReload: isInDevelopmentMode, dependencies, useYarn, strapiVersion } = AppInfo.useAppInfo('MarketplacePage', (state)=>state);
    const isOnline = useNavigatorOnline.useNavigatorOnline();
    const npmPackageType = query?.npmPackageType || PLUGIN;
    const [tabQuery, setTabQuery] = React__namespace.useState({
        plugin: npmPackageType === PLUGIN ? {
            ...query
        } : {},
        provider: npmPackageType === PROVIDER ? {
            ...query
        } : {}
    });
    React__namespace.useEffect(()=>{
        trackUsage('didGoToMarketplace');
    }, [
        trackUsage
    ]);
    React__namespace.useEffect(()=>{
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
    const { pluginsResponse, providersResponse, pluginsStatus, providersStatus, possibleCollections, possibleCategories, pagination } = useMarketplaceData.useMarketplaceData({
        npmPackageType,
        debouncedSearch,
        query,
        tabQuery,
        strapiVersion
    });
    if (!isOnline) {
        return /*#__PURE__*/ jsxRuntime.jsx(OfflineLayout.OfflineLayout, {});
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
    return /*#__PURE__*/ jsxRuntime.jsx(Layout.Layouts.Root, {
        children: /*#__PURE__*/ jsxRuntime.jsxs(PageHelpers.Page.Main, {
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Title, {
                    children: formatMessage({
                        id: 'admin.pages.MarketPlacePage.head',
                        defaultMessage: 'Marketplace - Plugins'
                    })
                }),
                /*#__PURE__*/ jsxRuntime.jsx(PageHeader.PageHeader, {
                    isOnline: isOnline,
                    npmPackageType: npmPackageType
                }),
                /*#__PURE__*/ jsxRuntime.jsx(Layout.Layouts.Content, {
                    children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Tabs.Root, {
                        variant: "simple",
                        onValueChange: handleTabChange,
                        value: npmPackageType,
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                justifyContent: "space-between",
                                paddingBottom: 4,
                                children: [
                                    /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Tabs.List, {
                                        "aria-label": formatMessage({
                                            id: 'admin.pages.MarketPlacePage.tab-group.label',
                                            defaultMessage: 'Plugins and Providers for Strapi'
                                        }),
                                        children: [
                                            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Tabs.Trigger, {
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
                                            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Tabs.Trigger, {
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
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                        width: "25%",
                                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Searchbar, {
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
                            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                paddingBottom: 4,
                                gap: 2,
                                children: [
                                    /*#__PURE__*/ jsxRuntime.jsx(SortSelect.SortSelect, {
                                        sortQuery: query?.sort || 'name:asc',
                                        handleSelectChange: handleSortSelectChange
                                    }),
                                    /*#__PURE__*/ jsxRuntime.jsx(NpmPackagesFilters.NpmPackagesFilters, {
                                        npmPackageType: npmPackageType,
                                        possibleCollections: possibleCollections,
                                        possibleCategories: possibleCategories,
                                        query: query || {},
                                        handleSelectChange: handleSelectChange,
                                        handleSelectClear: handleSelectClear
                                    })
                                ]
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tabs.Content, {
                                value: PLUGIN,
                                children: /*#__PURE__*/ jsxRuntime.jsx(NpmPackagesGrid.NpmPackagesGrid, {
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
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tabs.Content, {
                                value: PROVIDER,
                                children: /*#__PURE__*/ jsxRuntime.jsx(NpmPackagesGrid.NpmPackagesGrid, {
                                    npmPackages: providersResponse?.data,
                                    status: providersStatus,
                                    installedPackageNames: installedPackageNames,
                                    useYarn: useYarn,
                                    isInDevelopmentMode: isInDevelopmentMode,
                                    npmPackageType: "provider",
                                    debouncedSearch: debouncedSearch
                                })
                            }),
                            /*#__PURE__*/ jsxRuntime.jsxs(Pagination.Pagination.Root, {
                                ...pagination,
                                defaultPageSize: 24,
                                children: [
                                    /*#__PURE__*/ jsxRuntime.jsx(Pagination.Pagination.PageSize, {
                                        options: [
                                            '12',
                                            '24',
                                            '50',
                                            '100'
                                        ]
                                    }),
                                    /*#__PURE__*/ jsxRuntime.jsx(Pagination.Pagination.Links, {})
                                ]
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                paddingTop: 8,
                                children: /*#__PURE__*/ jsxRuntime.jsx("a", {
                                    href: "https://strapi.canny.io/plugin-requests",
                                    target: "_blank",
                                    rel: "noopener noreferrer nofollow",
                                    style: {
                                        textDecoration: 'none'
                                    },
                                    onClick: ()=>trackUsage('didMissMarketplacePlugin'),
                                    children: /*#__PURE__*/ jsxRuntime.jsx(ContentBox.ContentBox, {
                                        title: formatMessage({
                                            id: 'admin.pages.MarketPlacePage.missingPlugin.title',
                                            defaultMessage: 'Documentation'
                                        }),
                                        subtitle: formatMessage({
                                            id: 'admin.pages.MarketPlacePage.missingPlugin.description',
                                            defaultMessage: "Tell us what plugin you are looking for and we'll let our community plugin developers know in case they are in search for inspiration!"
                                        }),
                                        icon: /*#__PURE__*/ jsxRuntime.jsx(symbols.GlassesSquare, {}),
                                        iconBackground: "alternative100",
                                        endAction: /*#__PURE__*/ jsxRuntime.jsx(icons.ExternalLink, {
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
    const permissions = hooks.useTypedSelector((state)=>state.admin_app.permissions.marketplace?.main);
    return /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Protect, {
        permissions: permissions,
        children: /*#__PURE__*/ jsxRuntime.jsx(MarketplacePage, {})
    });
};

exports.MarketplacePage = MarketplacePage;
exports.ProtectedMarketplacePage = ProtectedMarketplacePage;
//# sourceMappingURL=MarketplacePage.js.map
