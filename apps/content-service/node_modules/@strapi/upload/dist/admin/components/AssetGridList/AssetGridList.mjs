import { jsxs, jsx } from 'react/jsx-runtime';
import { KeyboardNavigable, Box, Typography, Grid } from '@strapi/design-system';
import { styled } from 'styled-components';
import { AssetCard } from '../AssetCard/AssetCard.mjs';
import { Draggable } from './Draggable.mjs';

// TODO: find a better naming convention for the file that was an index file before
const DraggableAssetCard = styled(AssetCard)`
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
    return /*#__PURE__*/ jsxs(KeyboardNavigable, {
        tagName: "article",
        children: [
            title && /*#__PURE__*/ jsx(Box, {
                paddingTop: 2,
                paddingBottom: 2,
                children: /*#__PURE__*/ jsx(Typography, {
                    tag: "h2",
                    variant: "delta",
                    fontWeight: "semiBold",
                    children: title
                })
            }),
            /*#__PURE__*/ jsx(Grid.Root, {
                gap: 4,
                children: assets.map((asset, index)=>{
                    const isSelected = !!selectedAssets.find((currentAsset)=>currentAsset.id === asset.id);
                    if (onReorderAsset) {
                        return /*#__PURE__*/ jsx(Grid.Item, {
                            col: 3,
                            height: "100%",
                            children: /*#__PURE__*/ jsx(Draggable, {
                                index: index,
                                moveItem: onReorderAsset,
                                id: asset.id,
                                children: /*#__PURE__*/ jsx(DraggableAssetCard, {
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
                    return /*#__PURE__*/ jsx(Grid.Item, {
                        col: 3,
                        height: "100%",
                        direction: "column",
                        alignItems: "stretch",
                        children: /*#__PURE__*/ jsx(AssetCard, {
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

export { AssetGridList };
//# sourceMappingURL=AssetGridList.mjs.map
