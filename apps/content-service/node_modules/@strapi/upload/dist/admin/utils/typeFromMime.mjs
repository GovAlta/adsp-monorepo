import { AssetType } from '../constants.mjs';

const typeFromMime = (mime)=>{
    if (mime.includes(AssetType.Image)) {
        return AssetType.Image;
    }
    if (mime.includes(AssetType.Video)) {
        return AssetType.Video;
    }
    if (mime.includes(AssetType.Audio)) {
        return AssetType.Audio;
    }
    return AssetType.Document;
};

export { typeFromMime };
//# sourceMappingURL=typeFromMime.mjs.map
