'use strict';

var path = require('path');
var stream = require('stream');
var fse = require('fs-extra');

function getFileStream(filepath, strapi1, isLocal = false) {
    if (isLocal) {
        // Todo: handle errors
        return fse.createReadStream(filepath);
    }
    const readableStream = new stream.PassThrough();
    // fetch the image from remote url and stream it
    strapi1.fetch(filepath).then((res)=>{
        if (res.status !== 200) {
            readableStream.emit('error', new Error(`Request failed with status code ${res.status}`));
            return;
        }
        if (res.body) {
            // pipe the image data
            stream.Readable.fromWeb(res.body).pipe(readableStream);
        } else {
            readableStream.emit('error', new Error('Empty data found for file'));
        }
    }).catch((error)=>{
        readableStream.emit('error', error);
    });
    return readableStream;
}
function getFileStats(filepath, strapi1, isLocal = false) {
    if (isLocal) {
        return fse.stat(filepath);
    }
    return new Promise((resolve, reject)=>{
        strapi1.fetch(filepath).then((res)=>{
            if (res.status !== 200) {
                reject(new Error(`Request failed with status code ${res.status}`));
                return;
            }
            const contentLength = res.headers.get('content-length');
            const stats = {
                size: contentLength ? parseInt(contentLength, 10) : 0
            };
            resolve(stats);
        }).catch((error)=>{
            reject(error);
        });
    });
}
async function signFile(file) {
    const { provider } = strapi.plugins.upload;
    const { provider: providerName } = strapi.config.get('plugin.upload');
    const isPrivate = await provider.isPrivate();
    if (file?.provider === providerName && isPrivate) {
        const signUrl = async (file)=>{
            const signedUrl = await provider.getSignedUrl(file);
            file.url = signedUrl.url;
        };
        // Sign the original file
        await signUrl(file);
        // Sign each file format
        if (file.formats) {
            for (const format of Object.keys(file.formats)){
                await signUrl(file.formats[format]);
            }
        }
    }
}
/**
 * Generate and consume assets streams in order to stream each file individually
 */ const createAssetsStream = (strapi1)=>{
    const generator = async function*() {
        const stream = strapi1.db.queryBuilder('plugin::upload.file')// Create a query builder instance (default type is 'select')
        // Fetch all columns
        .select('*')// Get a readable stream
        .stream();
        for await (const file of stream){
            const isLocalProvider = file.provider === 'local';
            if (!isLocalProvider) {
                await signFile(file);
            }
            const filepath = isLocalProvider ? path.join(strapi1.dirs.static.public, file.url) : file.url;
            const stats = await getFileStats(filepath, strapi1, isLocalProvider);
            const stream = getFileStream(filepath, strapi1, isLocalProvider);
            yield {
                metadata: file,
                filepath,
                filename: file.hash + file.ext,
                stream,
                stats: {
                    size: stats.size
                }
            };
            if (file.formats) {
                for (const format of Object.keys(file.formats)){
                    const fileFormat = file.formats[format];
                    const fileFormatFilepath = isLocalProvider ? path.join(strapi1.dirs.static.public, fileFormat.url) : fileFormat.url;
                    const fileFormatStats = await getFileStats(fileFormatFilepath, strapi1, isLocalProvider);
                    const fileFormatStream = getFileStream(fileFormatFilepath, strapi1, isLocalProvider);
                    const metadata = {
                        ...fileFormat,
                        type: format,
                        id: file.id,
                        mainHash: file.hash
                    };
                    yield {
                        metadata,
                        filepath: fileFormatFilepath,
                        filename: fileFormat.hash + fileFormat.ext,
                        stream: fileFormatStream,
                        stats: {
                            size: fileFormatStats.size
                        }
                    };
                }
            }
        }
    };
    return stream.Duplex.from(generator());
};

exports.createAssetsStream = createAssetsStream;
//# sourceMappingURL=assets.js.map
