import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import { Typography, Box, Flex, Checkbox, IconButton, Button, Grid, VisuallyHidden, Divider } from '@strapi/design-system';
import { List, GridFour, Plus, Pencil } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { styled } from 'styled-components';
import { viewOptions, localStorageKeys } from '../../../constants.mjs';
import { useFolder } from '../../../hooks/useFolder.mjs';
import { usePersistentState } from '../../../hooks/usePersistentState.mjs';
import 'byte-size';
import 'date-fns';
import { getAllowedFiles } from '../../../utils/getAllowedFiles.mjs';
import { getBreadcrumbDataCM } from '../../../utils/getBreadcrumbDataCM.mjs';
import 'qs';
import { getTrad } from '../../../utils/getTrad.mjs';
import { toSingularTypes } from '../../../utils/toSingularTypes.mjs';
import '../../../utils/urlYupSchema.mjs';
import { AssetGridList } from '../../AssetGridList/AssetGridList.mjs';
import { Breadcrumbs } from '../../Breadcrumbs/Breadcrumbs.mjs';
import { EmptyAssets } from '../../EmptyAssets/EmptyAssets.mjs';
import { FolderCard } from '../../FolderCard/FolderCard/FolderCard.mjs';
import { FolderCardBody } from '../../FolderCard/FolderCardBody/FolderCardBody.mjs';
import { FolderCardBodyAction } from '../../FolderCard/FolderCardBodyAction/FolderCardBodyAction.mjs';
import { FolderGridList } from '../../FolderGridList/FolderGridList.mjs';
import { SortPicker } from '../../SortPicker/SortPicker.mjs';
import { TableList } from '../../TableList/TableList.mjs';
import { Filters } from './Filters.mjs';
import { PageSize } from './PageSize.mjs';
import { PaginationFooter } from './PaginationFooter/PaginationFooter.mjs';
import { SearchAsset } from './SearchAsset/SearchAsset.mjs';
import { isSelectable } from './utils/isSelectable.mjs';

// TODO: find a better naming convention for the file that was an index file before
const TypographyMaxWidth = styled(Typography)`
  max-width: 100%;
`;
const ActionContainer = styled(Box)`
  svg {
    path {
      fill: ${({ theme })=>theme.colors.neutral500};
    }
  }
`;
const BrowseStep = ({ allowedTypes = [], assets: rawAssets, canCreate, canRead, folders = [], multiple = false, onAddAsset, onChangeFilters, onChangePage, onChangePageSize, onChangeSearch, onChangeSort, onChangeFolder, onEditAsset, onEditFolder, onSelectAllAsset, onSelectAsset, pagination, queryObject, selectedAssets })=>{
    const { formatMessage } = useIntl();
    const [view, setView] = usePersistentState(localStorageKeys.modalView, viewOptions.GRID);
    const isGridView = view === viewOptions.GRID;
    const { data: currentFolder, isLoading: isCurrentFolderLoading } = useFolder(queryObject?.folder, {
        enabled: canRead && !!queryObject?.folder
    });
    const singularTypes = toSingularTypes(allowedTypes);
    const assets = rawAssets.map((asset)=>({
            ...asset,
            isSelectable: isSelectable(singularTypes, asset?.mime),
            type: 'asset'
        }));
    const breadcrumbs = !isCurrentFolderLoading ? getBreadcrumbDataCM(currentFolder) : undefined;
    const allAllowedAsset = getAllowedFiles(allowedTypes, assets);
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
    return /*#__PURE__*/ jsxs(Box, {
        children: [
            onSelectAllAsset && /*#__PURE__*/ jsx(Box, {
                paddingBottom: 4,
                children: /*#__PURE__*/ jsxs(Flex, {
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    children: [
                        (assetCount > 0 || folderCount > 0 || isFiltering) && /*#__PURE__*/ jsxs(Flex, {
                            gap: 2,
                            wrap: "wrap",
                            children: [
                                multiple && isGridView && /*#__PURE__*/ jsx(Flex, {
                                    paddingLeft: 2,
                                    paddingRight: 2,
                                    background: "neutral0",
                                    hasRadius: true,
                                    borderColor: "neutral200",
                                    height: "3.2rem",
                                    children: /*#__PURE__*/ jsx(Checkbox, {
                                        "aria-label": formatMessage({
                                            id: getTrad('bulk.select.label'),
                                            defaultMessage: 'Select all assets'
                                        }),
                                        checked: !areAllAssetSelected && hasSomeAssetSelected ? 'indeterminate' : areAllAssetSelected,
                                        onCheckedChange: onSelectAllAsset
                                    })
                                }),
                                isGridView && /*#__PURE__*/ jsx(SortPicker, {
                                    onChangeSort: onChangeSort,
                                    value: queryObject?.sort
                                }),
                                /*#__PURE__*/ jsx(Filters, {
                                    appliedFilters: queryObject?.filters?.$and,
                                    onChangeFilters: onChangeFilters
                                })
                            ]
                        }),
                        (assetCount > 0 || folderCount > 0 || isSearching) && /*#__PURE__*/ jsxs(Flex, {
                            marginLeft: "auto",
                            shrink: 0,
                            gap: 2,
                            children: [
                                /*#__PURE__*/ jsx(ActionContainer, {
                                    paddingTop: 1,
                                    paddingBottom: 1,
                                    children: /*#__PURE__*/ jsx(IconButton, {
                                        label: isGridView ? formatMessage({
                                            id: 'view-switch.list',
                                            defaultMessage: 'List View'
                                        }) : formatMessage({
                                            id: 'view-switch.grid',
                                            defaultMessage: 'Grid View'
                                        }),
                                        onClick: ()=>setView(isGridView ? viewOptions.LIST : viewOptions.GRID),
                                        children: isGridView ? /*#__PURE__*/ jsx(List, {}) : /*#__PURE__*/ jsx(GridFour, {})
                                    })
                                }),
                                /*#__PURE__*/ jsx(SearchAsset, {
                                    onChangeSearch: onChangeSearch,
                                    queryValue: queryObject._q || ''
                                })
                            ]
                        })
                    ]
                })
            }),
            canRead && breadcrumbs?.length && breadcrumbs.length > 0 && currentFolder && /*#__PURE__*/ jsx(Box, {
                paddingTop: 3,
                children: /*#__PURE__*/ jsx(Breadcrumbs, {
                    onChangeFolder: onChangeFolder,
                    label: formatMessage({
                        id: getTrad('header.breadcrumbs.nav.label'),
                        defaultMessage: 'Folders navigation'
                    }),
                    breadcrumbs: breadcrumbs,
                    currentFolderId: queryObject?.folder
                })
            }),
            assetCount === 0 && folderCount === 0 && /*#__PURE__*/ jsx(Box, {
                paddingBottom: 6,
                children: /*#__PURE__*/ jsx(EmptyAssets, {
                    size: "S",
                    count: 6,
                    action: canCreate && !isFiltering && !isSearching && /*#__PURE__*/ jsx(Button, {
                        variant: "secondary",
                        startIcon: /*#__PURE__*/ jsx(Plus, {}),
                        onClick: onAddAsset,
                        children: formatMessage({
                            id: getTrad('header.actions.add-assets'),
                            defaultMessage: 'Add new assets'
                        })
                    }),
                    content: // eslint-disable-next-line no-nested-ternary
                    isSearchingOrFiltering ? formatMessage({
                        id: getTrad('list.assets-empty.title-withSearch'),
                        defaultMessage: 'There are no assets with the applied filters'
                    }) : canCreate && !isSearching ? formatMessage({
                        id: getTrad('list.assets.empty'),
                        defaultMessage: 'Upload your first assets...'
                    }) : formatMessage({
                        id: getTrad('list.assets.empty.no-permissions'),
                        defaultMessage: 'The asset list is empty'
                    })
                })
            }),
            !isGridView && (folderCount > 0 || assetCount > 0) && /*#__PURE__*/ jsx(TableList, {
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
            isGridView && /*#__PURE__*/ jsxs(Fragment, {
                children: [
                    folderCount > 0 && /*#__PURE__*/ jsx(FolderGridList, {
                        title: (isSearchingOrFiltering && assetCount > 0 || !isSearchingOrFiltering) && formatMessage({
                            id: getTrad('list.folders.title'),
                            defaultMessage: 'Folders ({count})'
                        }, {
                            count: folderCount
                        }) || '',
                        children: folders.map((folder)=>{
                            return /*#__PURE__*/ jsx(Grid.Item, {
                                col: 3,
                                direction: "column",
                                alignItems: "stretch",
                                children: /*#__PURE__*/ jsx(FolderCard, {
                                    ariaLabel: folder.name,
                                    id: `folder-${folder.id}`,
                                    onClick: ()=>handleClickFolderCard(folder.id, folder.path),
                                    cardActions: onEditFolder && /*#__PURE__*/ jsx(IconButton, {
                                        withTooltip: false,
                                        label: formatMessage({
                                            id: getTrad('list.folder.edit'),
                                            defaultMessage: 'Edit folder'
                                        }),
                                        onClick: ()=>onEditFolder(folder),
                                        children: /*#__PURE__*/ jsx(Pencil, {})
                                    }),
                                    children: /*#__PURE__*/ jsx(FolderCardBody, {
                                        children: /*#__PURE__*/ jsx(FolderCardBodyAction, {
                                            onClick: ()=>handleClickFolderCard(folder.id, folder.path),
                                            children: /*#__PURE__*/ jsxs(Flex, {
                                                tag: "h2",
                                                direction: "column",
                                                alignItems: "start",
                                                maxWidth: "100%",
                                                children: [
                                                    /*#__PURE__*/ jsxs(TypographyMaxWidth, {
                                                        fontWeight: "semiBold",
                                                        ellipsis: true,
                                                        textColor: "neutral800",
                                                        children: [
                                                            folder.name,
                                                            /*#__PURE__*/ jsx(VisuallyHidden, {
                                                                children: "-"
                                                            })
                                                        ]
                                                    }),
                                                    /*#__PURE__*/ jsx(TypographyMaxWidth, {
                                                        tag: "span",
                                                        textColor: "neutral600",
                                                        variant: "pi",
                                                        ellipsis: true,
                                                        children: formatMessage({
                                                            id: getTrad('list.folder.subtitle'),
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
                    assetCount > 0 && folderCount > 0 && /*#__PURE__*/ jsx(Box, {
                        paddingTop: 6,
                        children: /*#__PURE__*/ jsx(Divider, {})
                    }),
                    assetCount > 0 && /*#__PURE__*/ jsx(Box, {
                        paddingTop: 6,
                        children: /*#__PURE__*/ jsx(AssetGridList, {
                            allowedTypes: allowedTypes,
                            size: "S",
                            assets: assets,
                            onSelectAsset: onSelectAsset,
                            selectedAssets: selectedAssets,
                            onEditAsset: onEditAsset,
                            title: (!isSearchingOrFiltering || isSearchingOrFiltering && folderCount > 0) && queryObject.page === 1 && formatMessage({
                                id: getTrad('list.assets.title'),
                                defaultMessage: 'Assets ({count})'
                            }, {
                                count: assetCount
                            }) || ''
                        })
                    })
                ]
            }),
            pagination.pageCount > 0 && /*#__PURE__*/ jsxs(Flex, {
                justifyContent: "space-between",
                paddingTop: 4,
                position: "relative",
                zIndex: 1,
                children: [
                    /*#__PURE__*/ jsx(PageSize, {
                        pageSize: queryObject.pageSize,
                        onChangePageSize: onChangePageSize
                    }),
                    /*#__PURE__*/ jsx(PaginationFooter, {
                        activePage: queryObject.page,
                        onChangePage: onChangePage,
                        pagination: pagination
                    })
                ]
            })
        ]
    });
};

export { BrowseStep };
//# sourceMappingURL=BrowseStep.mjs.map
