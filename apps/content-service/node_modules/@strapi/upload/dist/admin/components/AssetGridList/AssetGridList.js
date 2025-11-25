'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var styledComponents = require('styled-components');
var AssetCard = require('../AssetCard/AssetCard.js');
var Draggable = require('./Draggable.js');

// TODO: find a better naming convention for the file that was an index file before
const DraggableAssetCard = styledComponents.styled(AssetCard.AssetCard)`
  && {
    cursor: inherit;
  }
`;
const AssetGridList = ({ allowedTypes = [
    'files',
    'images',
    'videos',
    'audios'
], assets, onEditAsset, onSelectAsset, selectedAssets, size = 'M', onReorderAsset, title = null })=>{
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.KeyboardNavigable, {
        tagName: "article",
        children: [
            title && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                paddingTop: 2,
                paddingBottom: 2,
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                    tag: "h2",
                    variant: "delta",
                    fontWeight: "semiBold",
                    children: title
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Root, {
                gap: 4,
                children: assets.map((asset, index)=>{
                    const isSelected = !!selectedAssets.find((currentAsset)=>currentAsset.id === asset.id);
                    if (onReorderAsset) {
                        return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                            col: 3,
                            height: "100%",
                            children: /*#__PURE__*/ jsxRuntime.jsx(Draggable.Draggable, {
                                index: index,
                                moveItem: onReorderAsset,
                                id: asset.id,
                                children: /*#__PURE__*/ jsxRuntime.jsx(DraggableAssetCard, {
                                    allowedTypes: allowedTypes,
                                    asset: asset,
                                    isSelected: isSelected,
                                    onEdit: onEditAsset ? ()=>onEditAsset(asset) : undefined,
                                    onSelect: ()=>onSelectAsset(asset),
                                    size: size
                                })
                            })
                        }, asset.id);
                    }
                    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                        col: 3,
                        height: "100%",
                        direction: "column",
                        alignItems: "stretch",
                        children: /*#__PURE__*/ jsxRuntime.jsx(AssetCard.AssetCard, {
                            allowedTypes: allowedTypes,
                            asset: asset,
                            isSelected: isSelected,
                            onEdit: onEditAsset ? ()=>onEditAsset(asset) : undefined,
                            onSelect: ()=>onSelectAsset(asset),
                            size: size
                        }, asset.id)
                    }, asset.id);
                })
            })
        ]
    });
};

exports.AssetGridList = AssetGridList;
//# sourceMappingURL=AssetGridList.js.map
