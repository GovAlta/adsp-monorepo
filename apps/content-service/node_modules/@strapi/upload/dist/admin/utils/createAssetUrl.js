'use strict';

var prefixFileUrlWithBackendUrl = require('./prefixFileUrlWithBackendUrl.js');

const createAssetUrl = (asset, forThumbnail = true)=>{
    if (asset.isLocal) {
        return asset.url;
    }
    const assetUrl = forThumbnail ? asset?.formats?.thumbnail?.url || asset.url : asset.url;
    return prefixFileUrlWithBackendUrl.prefixFileUrlWithBackendUrl(assetUrl);
};

exports.createAssetUrl = createAssetUrl;
//# sourceMappingURL=createAssetUrl.js.map
