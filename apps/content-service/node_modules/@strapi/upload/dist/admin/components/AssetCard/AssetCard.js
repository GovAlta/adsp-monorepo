'use strict';

var jsxRuntime = require('react/jsx-runtime');
var constants = require('../../constants.js');
var createAssetUrl = require('../../utils/createAssetUrl.js');
require('byte-size');
require('date-fns');
require('qs');
var getFileExtension = require('../../utils/getFileExtension.js');
var prefixFileUrlWithBackendUrl = require('../../utils/prefixFileUrlWithBackendUrl.js');
require('../../utils/urlYupSchema.js');
var AudioAssetCard = require('./AudioAssetCard.js');
var DocAssetCard = require('./DocAssetCard.js');
var ImageAssetCard = require('./ImageAssetCard.js');
var VideoAssetCard = require('./VideoAssetCard.js');

const AssetCard = ({ asset, isSelected = false, onSelect, onEdit, onRemove, size = 'M', local = false, className })=>{
    const handleSelect = onSelect ? ()=>onSelect(asset) : undefined;
    const commonAssetCardProps = {
        id: asset.id,
        isSelectable: asset.isSelectable,
        extension: getFileExtension.getFileExtension(asset.ext),
        name: asset.name,
        url: local ? asset.url : createAssetUrl.createAssetUrl(asset, true),
        mime: asset.mime,
        onEdit: onEdit ? ()=>onEdit(asset) : undefined,
        onSelect: handleSelect,
        onRemove: onRemove ? ()=>onRemove(asset) : undefined,
        selected: isSelected,
        size,
        className
    };
    if (asset.mime?.includes(constants.AssetType.Video)) {
        return /*#__PURE__*/ jsxRuntime.jsx(VideoAssetCard.VideoAssetCard, {
            ...commonAssetCardProps
        });
    }
    if (asset.mime?.includes(constants.AssetType.Image)) {
        return /*#__PURE__*/ jsxRuntime.jsx(ImageAssetCard.ImageAssetCard, {
            alt: asset.alternativeText || asset.name,
            height: asset.height,
            thumbnail: prefixFileUrlWithBackendUrl.prefixFileUrlWithBackendUrl(asset?.formats?.thumbnail?.url || asset.url),
            width: asset.width,
            updatedAt: asset.updatedAt,
            isUrlSigned: asset?.isUrlSigned || false,
            ...commonAssetCardProps
        });
    }
    if (asset.mime?.includes(constants.AssetType.Audio)) {
        return /*#__PURE__*/ jsxRuntime.jsx(AudioAssetCard.AudioAssetCard, {
            ...commonAssetCardProps
        });
    }
    return /*#__PURE__*/ jsxRuntime.jsx(DocAssetCard.DocAssetCard, {
        ...commonAssetCardProps
    });
};

exports.AssetCard = AssetCard;
//# sourceMappingURL=AssetCard.js.map
