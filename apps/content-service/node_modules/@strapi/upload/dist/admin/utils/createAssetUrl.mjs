import { prefixFileUrlWithBackendUrl } from './prefixFileUrlWithBackendUrl.mjs';

const createAssetUrl = (asset, forThumbnail = true)=>{
    if (asset.isLocal) {
        return asset.url;
    }
    const assetUrl = forThumbnail ? asset?.formats?.thumbnail?.url || asset.url : asset.url;
    return prefixFileUrlWithBackendUrl(assetUrl);
};

export { createAssetUrl };
//# sourceMappingURL=createAssetUrl.mjs.map
