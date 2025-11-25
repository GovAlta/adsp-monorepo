'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var appendSearchParamsToUrl = require('../../utils/appendSearchParamsToUrl.js');
require('byte-size');
require('date-fns');
require('qs');
require('../../constants.js');
require('../../utils/urlYupSchema.js');
var AssetCardBase = require('./AssetCardBase.js');

const ImageAssetCard = ({ height, width, thumbnail, size = 'M', alt, isUrlSigned, selected = false, ...props })=>{
    // appending the updatedAt param to the thumbnail URL prevents it from being cached by the browser (cache busting)
    // applied only if the url is not signed to prevent the signature from being invalidated
    const thumbnailUrl = isUrlSigned ? thumbnail : appendSearchParamsToUrl.appendSearchParamsToUrl({
        url: thumbnail,
        params: {
            updatedAt: props.updatedAt
        }
    });
    const subtitle = height && width ? ` - ${width}✕${height}` : undefined;
    return /*#__PURE__*/ jsxRuntime.jsx(AssetCardBase.AssetCardBase, {
        ...props,
        selected: selected,
        subtitle: subtitle,
        variant: "Image",
        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.CardAsset, {
            src: thumbnailUrl,
            size: size,
            alt: alt
        })
    });
};

exports.ImageAssetCard = ImageAssetCard;
//# sourceMappingURL=ImageAssetCard.js.map
