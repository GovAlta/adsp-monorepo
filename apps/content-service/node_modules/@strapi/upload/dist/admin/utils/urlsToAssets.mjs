import { AssetSource } from '../constants.mjs';
import { typeFromMime } from './typeFromMime.mjs';

function getFilenameFromURL(url) {
    return new URL(url).pathname.split('/').pop();
}
const urlsToAssets = async (urls)=>{
    const assetPromises = urls.map((url)=>fetch(url).then(async (res)=>{
            const blob = await res.blob();
            const loadedFile = new File([
                blob
            ], getFilenameFromURL(res.url), {
                type: res.headers.get('content-type') || undefined
            });
            return {
                name: loadedFile.name,
                url: res.url,
                mime: res.headers.get('content-type'),
                rawFile: loadedFile
            };
        }));
    // Retrieve the assets metadata
    const assetsResults = await Promise.all(assetPromises);
    const assets = assetsResults.map((fullFilledAsset)=>({
            source: AssetSource.Url,
            name: fullFilledAsset.name,
            type: typeFromMime(fullFilledAsset.mime),
            url: fullFilledAsset.url,
            ext: fullFilledAsset.url.split('.').pop(),
            mime: fullFilledAsset.mime ? fullFilledAsset.mime : undefined,
            rawFile: fullFilledAsset.rawFile
        }));
    return assets;
};

export { urlsToAssets };
//# sourceMappingURL=urlsToAssets.mjs.map
