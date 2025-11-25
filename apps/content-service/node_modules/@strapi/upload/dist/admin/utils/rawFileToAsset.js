'use strict';

var typeFromMime = require('./typeFromMime.js');

const rawFileToAsset = (rawFile, assetSource)=>{
    return {
        size: rawFile.size / 1000,
        createdAt: new Date(rawFile.lastModified).toISOString(),
        name: rawFile.name,
        source: assetSource,
        type: typeFromMime.typeFromMime(rawFile.type),
        url: URL.createObjectURL(rawFile),
        ext: rawFile.name.split('.').pop(),
        mime: rawFile.type,
        rawFile,
        isLocal: true
    };
};

exports.rawFileToAsset = rawFileToAsset;
//# sourceMappingURL=rawFileToAsset.js.map
