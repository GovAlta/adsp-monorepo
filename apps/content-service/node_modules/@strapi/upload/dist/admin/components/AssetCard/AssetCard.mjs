import { jsx } from 'react/jsx-runtime';
import { AssetType } from '../../constants.mjs';
import { createAssetUrl } from '../../utils/createAssetUrl.mjs';
import 'byte-size';
import 'date-fns';
import 'qs';
import { getFileExtension } from '../../utils/getFileExtension.mjs';
import { prefixFileUrlWithBackendUrl } from '../../utils/prefixFileUrlWithBackendUrl.mjs';
import '../../utils/urlYupSchema.mjs';
import { AudioAssetCard } from './AudioAssetCard.mjs';
import { DocAssetCard } from './DocAssetCard.mjs';
import { ImageAssetCard } from './ImageAssetCard.mjs';
import { VideoAssetCard } from './VideoAssetCard.mjs';

const AssetCard = ({ asset, isSelected = false, onSelect, onEdit, onRemove, size = 'M', local = false, className })=>{
    const handleSelect = onSelect ? ()=>onSelect(asset) : undefined;
    const commonAssetCardProps = {
        id: asset.id,
        isSelectable: asset.isSelectable,
        extension: getFileExtension(asset.ext),
        name: asset.name,
        url: local ? asset.url : createAssetUrl(asset, true),
        mime: asset.mime,
        onEdit: onEdit ? ()=>onEdit(asset) : undefined,
        onSelect: handleSelect,
        onRemove: onRemove ? ()=>onRemove(asset) : undefined,
        selected: isSelected,
        size,
        className
    };
    if (asset.mime?.includes(AssetType.Video)) {
        return /*#__PURE__*/ jsx(VideoAssetCard, {
            ...commonAssetCardProps
        });
    }
    if (asset.mime?.includes(AssetType.Image)) {
        return /*#__PURE__*/ jsx(ImageAssetCard, {
            alt: asset.alternativeText || asset.name,
            height: asset.height,
            thumbnail: prefixFileUrlWithBackendUrl(asset?.formats?.thumbnail?.url || asset.url),
            width: asset.width,
            updatedAt: asset.updatedAt,
            isUrlSigned: asset?.isUrlSigned || false,
            ...commonAssetCardProps
        });
    }
    if (asset.mime?.includes(AssetType.Audio)) {
        return /*#__PURE__*/ jsx(AudioAssetCard, {
            ...commonAssetCardProps
        });
    }
    return /*#__PURE__*/ jsx(DocAssetCard, {
        ...commonAssetCardProps
    });
};

export { AssetCard };
//# sourceMappingURL=AssetCard.mjs.map
