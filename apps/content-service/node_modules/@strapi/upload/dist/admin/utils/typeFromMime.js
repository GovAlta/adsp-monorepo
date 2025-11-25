'use strict';

var constants = require('../constants.js');

const typeFromMime = (mime)=>{
    if (mime.includes(constants.AssetType.Image)) {
        return constants.AssetType.Image;
    }
    if (mime.includes(constants.AssetType.Video)) {
        return constants.AssetType.Video;
    }
    if (mime.includes(constants.AssetType.Audio)) {
        return constants.AssetType.Audio;
    }
    return constants.AssetType.Document;
};

exports.typeFromMime = typeFromMime;
//# sourceMappingURL=typeFromMime.js.map
