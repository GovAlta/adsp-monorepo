'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var styledComponents = require('styled-components');
var constants = require('../../../constants.js');
var useFolder = require('../../../hooks/useFolder.js');
var usePersistentState = require('../../../hooks/usePersistentState.js');
require('byte-size');
require('date-fns');
var getAllowedFiles = require('../../../utils/getAllowedFiles.js');
var getBreadcrumbDataCM = require('../../../utils/getBreadcrumbDataCM.js');
require('qs');
var getTrad = require('../../../utils/getTrad.js');
var toSingularTypes = require('../../../utils/toSingularTypes.js');
require('../../../utils/urlYupSchema.js');
var AssetGridList = require('../../AssetGridList/AssetGridList.js');
var Breadcrumbs = require('../../Breadcrumbs/Breadcrumbs.js');
var EmptyAssets = require('../../EmptyAssets/EmptyAssets.js');
var FolderCard = require('../../FolderCard/FolderCard/FolderCard.js');
var FolderCardBody = require('../../FolderCard/FolderCardBody/FolderCardBody.js');
var FolderCardBodyAction = require('../../FolderCard/FolderCardBodyAction/FolderCardBodyAction.js');
var FolderGridList = require('../../FolderGridList/FolderGridList.js');
var SortPicker = require('../../SortPicker/SortPicker.js');
var TableList = require('../../TableList/TableList.js');
var Filters = require('./Filters.js');
var PageSize = require('./PageSize.js');
var PaginationFooter = require('./PaginationFooter/PaginationFooter.js');
var SearchAsset = require('./SearchAsset/SearchAsset.js');
var isSelectable = require('./utils/isSelectable.js');

// TODO: find a better naming convention for the file that was an index file before
const TypographyMaxWidth = styledComponents.styled(designSystem.Typography)`
  max-width: 100%;
`;
const ActionContainer = styledComponents.styled(designSystem.Box)`
  svg {
    path {
      fill: ${({ theme })=>theme.colors.neutral500};
    }
  }
`;
const BrowseStep = ({ allowedTypes = [], assets: rawAssets, canCreate, canRead, folders = [], multiple = false, onAddAsset, onChangeFilters, onChangePage, onChangePageSize, onChangeSearch, onChangeSort, onChangeFolder, onEditAsset, onEditFolder, onSelectAllAsset, onSelectAsset, pagination, queryObject, selectedAssets })=>{
    const { formatMessage } = reactIntl.useIntl();
    const [view, setView] = usePersistentState.usePersistentState(constants.localStorageKeys.modalView, constants.viewOptions.GRID);
    const isGridView = view === constants.viewOptions.GRID;
    const { data: currentFolder, isLoading: isCurrentFolderLoading } = useFolder.useFolder(queryObject?.folder, {
        enabled: canRead && !!queryObject?.folder
    });
    const singularTypes = toSingularTypes.toSingularTypes(allowedTypes);
    const assets = rawAssets.map((asset)=>({
            ...asset,
            isSelectable: isSelectable.isSelectable(singularTypes, asset?.mime),
            type: 'asset'
        }));
    const breadcrumbs = !isCurrentFolderLoading ? getBreadcrumbDataCM.getBreadcrumbDataCM(currentFolder) : undefined;
    const allAllowedAsset = getAllowedFiles.getAllowedFiles(allowedTypes, assets);
    const areAllAssetSelected = allAllowedAsset.length > 0 && selectedAssets.length > 0 && allAllowedAsset.every((asset)=>selectedAssets.findIndex((currAsset)=>currAsset.id === asset.id) !== -1);
    const hasSomeAssetSelected = allAllowedAsset.some((asset)=>selectedAssets.findIndex((currAsset)=>currAsset.id === asset.id) !== -1);
    const isSearching = !!queryObject?._q;
    const isFiltering = !!queryObject?.filters?.$and?.length && queryObject.filters.$and.length > 0;
    const isSearchingOrFiltering = isSearching || isFiltering;
    const assetCount = assets.length;
    const folderCount = folders.length;
    const handleClickFolderCard = (...args)=>{
        // Search query will always fetch the same results
        // we remove it here to allow navigating in a folder and see the result of this navigation
        onChangeSearch('');
        onChangeFolder(...args);
    };
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Box, {
        children: [
            onSelectAllAsset && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                paddingBottom: 4,
                children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    children: [
                        (assetCount > 0 || folderCount > 0 || isFiltering) && /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                            gap: 2,
                            wrap: "wrap",
                            children: [
                                multiple && isGridView && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                                    paddingLeft: 2,
                                    paddingRight: 2,
                                    background: "neutral0",
                                    hasRadius: true,
                                    borderColor: "neutral200",
                                    height: "3.2rem",
                                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Checkbox, {
                                        "aria-label": formatMessage({
                                            id: getTrad.getTrad('bulk.select.label'),
                                            defaultMessage: 'Select all assets'
                                        }),
                                        checked: !areAllAssetSelected && hasSomeAssetSelected ? 'indeterminate' : areAllAssetSelected,
                                        onCheckedChange: onSelectAllAsset
                                    })
                                }),
                                isGridView && /*#__PURE__*/ jsxRuntime.jsx(SortPicker.SortPicker, {
                                    onChangeSort: onChangeSort,
                                    value: queryObject?.sort
                                }),
                                /*#__PURE__*/ jsxRuntime.jsx(Filters.Filters, {
                                    appliedFilters: queryObject?.filters?.$and,
                                    onChangeFilters: onChangeFilters
                                })
                            ]
                        }),
                        (assetCount > 0 || folderCount > 0 || isSearching) && /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                            marginLeft: "auto",
                            shrink: 0,
                            gap: 2,
                            children: [
                                /*#__PURE__*/ jsxRuntime.jsx(ActionContainer, {
                                    paddingTop: 1,
                                    paddingBottom: 1,
                                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                                        label: isGridView ? formatMessage({
                                            id: 'view-switch.list',
                                            defaultMessage: 'List View'
                                        }) : formatMessage({
                                            id: 'view-switch.grid',
                                            defaultMessage: 'Grid View'
                                        }),
                                        onClick: ()=>setView(isGridView ? constants.viewOptions.LIST : constants.viewOptions.GRID),
                                        children: isGridView ? /*#__PURE__*/ jsxRuntime.jsx(icons.List, {}) : /*#__PURE__*/ jsxRuntime.jsx(icons.GridFour, {})
                                    })
                                }),
                                /*#__PURE__*/ jsxRuntime.jsx(SearchAsset.SearchAsset, {
                                    onChangeSearch: onChangeSearch,
                                    queryValue: queryObject._q || ''
                                })
                            ]
                        })
                    ]
                })
            }),
            canRead && breadcrumbs?.length && breadcrumbs.length > 0 && currentFolder && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                paddingTop: 3,
                children: /*#__PURE__*/ jsxRuntime.jsx(Breadcrumbs.Breadcrumbs, {
                    onChangeFolder: onChangeFolder,
                    label: formatMessage({
                        id: getTrad.getTrad('header.breadcrumbs.nav.label'),
                        defaultMessage: 'Folders navigation'
                    }),
                    breadcrumbs: breadcrumbs,
                    currentFolderId: queryObject?.folder
                })
            }),
            assetCount === 0 && folderCount === 0 && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                paddingBottom: 6,
                children: /*#__PURE__*/ jsxRuntime.jsx(EmptyAssets.EmptyAssets, {
                    size: "S",
                    count: 6,
                    action: canCreate && !isFiltering && !isSearching && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                        variant: "secondary",
                        startIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.Plus, {}),
                        onClick: onAddAsset,
                        children: formatMessage({
                            id: getTrad.getTrad('header.actions.add-assets'),
                            defaultMessage: 'Add new assets'
                        })
                    }),
                    content: // eslint-disable-next-line no-nested-ternary
                    isSearchingOrFiltering ? formatMessage({
                        id: getTrad.getTrad('list.assets-empty.title-withSearch'),
                        defaultMessage: 'There are no assets with the applied filters'
                    }) : canCreate && !isSearching ? formatMessage({
                        id: getTrad.getTrad('list.assets.empty'),
                        defaultMessage: 'Upload your first assets...'
                    }) : formatMessage({
                        id: getTrad.getTrad('list.assets.empty.no-permissions'),
                        defaultMessage: 'The asset list is empty'
                    })
                })
            }),
            !isGridView && (folderCount > 0 || assetCount > 0) && /*#__PURE__*/ jsxRuntime.jsx(TableList.TableList, {
                allowedTypes: allowedTypes,
                assetCount: assetCount,
                folderCount: folderCount,
                indeterminate: !areAllAssetSelected && hasSomeAssetSelected,
                isFolderSelectionAllowed: false,
                onChangeSort: onChangeSort,
                onChangeFolder: handleClickFolderCard,
                onEditAsset: onEditAsset,
                onEditFolder: onEditFolder,
                onSelectOne: onSelectAsset,
                onSelectAll: onSelectAllAsset,
                rows: [
                    ...folders.map((folder)=>({
                            ...folder,
                            type: 'folder'
                        })),
                    ...assets
                ],
                selected: selectedAssets,
                shouldDisableBulkSelect: !multiple,
                sortQuery: queryObject?.sort ?? ''
            }),
            isGridView && /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
                children: [
                    folderCount > 0 && /*#__PURE__*/ jsxRuntime.jsx(FolderGridList.FolderGridList, {
                        title: (isSearchingOrFiltering && assetCount > 0 || !isSearchingOrFiltering) && formatMessage({
                            id: getTrad.getTrad('list.folders.title'),
                            defaultMessage: 'Folders ({count})'
                        }, {
                            count: folderCount
                        }) || '',
                        children: folders.map((folder)=>{
                            return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                                col: 3,
                                direction: "column",
                                alignItems: "stretch",
                                children: /*#__PURE__*/ jsxRuntime.jsx(FolderCard.FolderCard, {
                                    ariaLabel: folder.name,
                                    id: `folder-${folder.id}`,
                                    onClick: ()=>handleClickFolderCard(folder.id, folder.path),
                                    cardActions: onEditFolder && /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                                        withTooltip: false,
                                        label: formatMessage({
                                            id: getTrad.getTrad('list.folder.edit'),
                                            defaultMessage: 'Edit folder'
                                        }),
                                        onClick: ()=>onEditFolder(folder),
                                        children: /*#__PURE__*/ jsxRuntime.jsx(icons.Pencil, {})
                                    }),
                                    children: /*#__PURE__*/ jsxRuntime.jsx(FolderCardBody.FolderCardBody, {
                                        children: /*#__PURE__*/ jsxRuntime.jsx(FolderCardBodyAction.FolderCardBodyAction, {
                                            onClick: ()=>handleClickFolderCard(folder.id, folder.path),
                                            children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                                tag: "h2",
                                                direction: "column",
                                                alignItems: "start",
                                                maxWidth: "100%",
                                                children: [
                                                    /*#__PURE__*/ jsxRuntime.jsxs(TypographyMaxWidth, {
                                                        fontWeight: "semiBold",
                                                        ellipsis: true,
                                                        textColor: "neutral800",
                                                        children: [
                                                            folder.name,
                                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.VisuallyHidden, {
                                                                children: "-"
                                                            })
                                                        ]
                                                    }),
                                                    /*#__PURE__*/ jsxRuntime.jsx(TypographyMaxWidth, {
                                                        tag: "span",
                                                        textColor: "neutral600",
                                                        variant: "pi",
                                                        ellipsis: true,
                                                        children: formatMessage({
                                                            id: getTrad.getTrad('list.folder.subtitle'),
                                                            defaultMessage: '{folderCount, plural, =0 {# folder} one {# folder} other {# folders}}, {filesCount, plural, =0 {# asset} one {# asset} other {# assets}}'
                                                        }, {
                                                            folderCount: folder.children?.count,
                                                            filesCount: folder.files?.count
                                                        })
                                                    })
                                                ]
                                            })
                                        })
                                    })
                                })
                            }, `folder-${folder.id}`);
                        })
                    }),
                    assetCount > 0 && folderCount > 0 && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                        paddingTop: 6,
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Divider, {})
                    }),
                    assetCount > 0 && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                        paddingTop: 6,
                        children: /*#__PURE__*/ jsxRuntime.jsx(AssetGridList.AssetGridList, {
                            allowedTypes: allowedTypes,
                            size: "S",
                            assets: assets,
                            onSelectAsset: onSelectAsset,
                            selectedAssets: selectedAssets,
                            onEditAsset: onEditAsset,
                            title: (!isSearchingOrFiltering || isSearchingOrFiltering && folderCount > 0) && queryObject.page === 1 && formatMessage({
                                id: getTrad.getTrad('list.assets.title'),
                                defaultMessage: 'Assets ({count})'
                            }, {
                                count: assetCount
                            }) || ''
                        })
                    })
                ]
            }),
            pagination.pageCount > 0 && /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                justifyContent: "space-between",
                paddingTop: 4,
                position: "relative",
                zIndex: 1,
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(PageSize.PageSize, {
                        pageSize: queryObject.pageSize,
                        onChangePageSize: onChangePageSize
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(PaginationFooter.PaginationFooter, {
                        activePage: queryObject.page,
                        onChangePage: onChangePage,
                        pagination: pagination
                    })
                ]
            })
        ]
    });
};

exports.BrowseStep = BrowseStep;
//# sourceMappingURL=BrowseStep.js.map
