'use strict';

var path = require('path');
var zip = require('zlib');
var stream = require('stream');
var fse = require('fs-extra');
var tar = require('tar-stream');
var Stringer = require('stream-json/jsonl/Stringer');
var streamChain = require('stream-chain');
var encrypt = require('../../../utils/encryption/encrypt.js');
require('crypto');
var utils = require('./utils.js');
var providers = require('../../../errors/providers.js');

function _class_private_field_loose_base(receiver, privateKey) {
    if (!Object.prototype.hasOwnProperty.call(receiver, privateKey)) {
        throw new TypeError("attempted to use private field on non-instance");
    }
    return receiver;
}
var id = 0;
function _class_private_field_loose_key(name) {
    return "__private_" + id++ + "_" + name;
}
const createLocalFileDestinationProvider = (options)=>{
    return new LocalFileDestinationProvider(options);
};
var _providersMetadata = /*#__PURE__*/ _class_private_field_loose_key("_providersMetadata"), _archive = /*#__PURE__*/ _class_private_field_loose_key("_archive"), _diagnostics = /*#__PURE__*/ _class_private_field_loose_key("_diagnostics"), _reportInfo = /*#__PURE__*/ _class_private_field_loose_key("_reportInfo"), _archivePath = /*#__PURE__*/ _class_private_field_loose_key("_archivePath"), _writeMetadata = /*#__PURE__*/ _class_private_field_loose_key("_writeMetadata"), _getMetadataStream = /*#__PURE__*/ _class_private_field_loose_key("_getMetadataStream");
class LocalFileDestinationProvider {
    setMetadata(target, metadata) {
        _class_private_field_loose_base(this, _providersMetadata)[_providersMetadata][target] = metadata;
        return this;
    }
    createGzip() {
        _class_private_field_loose_base(this, _reportInfo)[_reportInfo]('creating gzip');
        return zip.createGzip();
    }
    bootstrap(diagnostics) {
        _class_private_field_loose_base(this, _diagnostics)[_diagnostics] = diagnostics;
        const { compression, encryption } = this.options;
        if (encryption.enabled && !encryption.key) {
            throw new Error("Can't encrypt without a key");
        }
        _class_private_field_loose_base(this, _archive)[_archive].stream = tar.pack();
        const outStream = fse.createWriteStream(_class_private_field_loose_base(this, _archivePath)[_archivePath]);
        outStream.on('error', (err)=>{
            if (err.code === 'ENOSPC') {
                throw new providers.ProviderTransferError("Your server doesn't have space to proceed with the import.");
            }
            throw err;
        });
        const archiveTransforms = [];
        if (compression.enabled) {
            archiveTransforms.push(this.createGzip());
        }
        if (encryption.enabled && encryption.key) {
            archiveTransforms.push(encrypt.createEncryptionCipher(encryption.key));
        }
        _class_private_field_loose_base(this, _archive)[_archive].pipeline = streamChain.chain([
            _class_private_field_loose_base(this, _archive)[_archive].stream,
            ...archiveTransforms,
            outStream
        ]);
        this.results.file = {
            path: _class_private_field_loose_base(this, _archivePath)[_archivePath]
        };
    }
    async close() {
        const { stream, pipeline } = _class_private_field_loose_base(this, _archive)[_archive];
        if (!stream) {
            return;
        }
        await _class_private_field_loose_base(this, _writeMetadata)[_writeMetadata]();
        stream.finalize();
        if (pipeline && !pipeline.closed) {
            await new Promise((resolve, reject)=>{
                pipeline.on('close', resolve).on('error', reject);
            });
        }
    }
    async rollback() {
        _class_private_field_loose_base(this, _reportInfo)[_reportInfo]('rolling back');
        await this.close();
        await fse.rm(_class_private_field_loose_base(this, _archivePath)[_archivePath], {
            force: true
        });
    }
    getMetadata() {
        return null;
    }
    createSchemasWriteStream() {
        if (!_class_private_field_loose_base(this, _archive)[_archive].stream) {
            throw new Error('Archive stream is unavailable');
        }
        _class_private_field_loose_base(this, _reportInfo)[_reportInfo]('creating schemas write stream');
        const filePathFactory = utils.createFilePathFactory('schemas');
        const entryStream = utils.createTarEntryStream(_class_private_field_loose_base(this, _archive)[_archive].stream, filePathFactory, this.options.file.maxSizeJsonl);
        return streamChain.chain([
            Stringer.stringer(),
            entryStream
        ]);
    }
    createEntitiesWriteStream() {
        if (!_class_private_field_loose_base(this, _archive)[_archive].stream) {
            throw new Error('Archive stream is unavailable');
        }
        _class_private_field_loose_base(this, _reportInfo)[_reportInfo]('creating entities write stream');
        const filePathFactory = utils.createFilePathFactory('entities');
        const entryStream = utils.createTarEntryStream(_class_private_field_loose_base(this, _archive)[_archive].stream, filePathFactory, this.options.file.maxSizeJsonl);
        return streamChain.chain([
            Stringer.stringer(),
            entryStream
        ]);
    }
    createLinksWriteStream() {
        if (!_class_private_field_loose_base(this, _archive)[_archive].stream) {
            throw new Error('Archive stream is unavailable');
        }
        _class_private_field_loose_base(this, _reportInfo)[_reportInfo]('creating links write stream');
        const filePathFactory = utils.createFilePathFactory('links');
        const entryStream = utils.createTarEntryStream(_class_private_field_loose_base(this, _archive)[_archive].stream, filePathFactory, this.options.file.maxSizeJsonl);
        return streamChain.chain([
            Stringer.stringer(),
            entryStream
        ]);
    }
    createConfigurationWriteStream() {
        if (!_class_private_field_loose_base(this, _archive)[_archive].stream) {
            throw new Error('Archive stream is unavailable');
        }
        _class_private_field_loose_base(this, _reportInfo)[_reportInfo]('creating configuration write stream');
        const filePathFactory = utils.createFilePathFactory('configuration');
        const entryStream = utils.createTarEntryStream(_class_private_field_loose_base(this, _archive)[_archive].stream, filePathFactory, this.options.file.maxSizeJsonl);
        return streamChain.chain([
            Stringer.stringer(),
            entryStream
        ]);
    }
    createAssetsWriteStream() {
        const { stream: archiveStream } = _class_private_field_loose_base(this, _archive)[_archive];
        if (!archiveStream) {
            throw new Error('Archive stream is unavailable');
        }
        _class_private_field_loose_base(this, _reportInfo)[_reportInfo]('creating assets write stream');
        return new stream.Writable({
            objectMode: true,
            write (data, _encoding, callback) {
                // always write tar files with posix paths so we have a standard format for paths regardless of system
                const entryPath = path.posix.join('assets', 'uploads', data.filename);
                const entryMetadataPath = path.posix.join('assets', 'metadata', `${data.filename}.json`);
                const stringifiedMetadata = JSON.stringify(data.metadata);
                archiveStream.entry({
                    name: entryMetadataPath,
                    size: stringifiedMetadata.length
                }, stringifiedMetadata);
                const entry = archiveStream.entry({
                    name: entryPath,
                    size: data.stats.size
                });
                if (!entry) {
                    callback(new Error(`Failed to created an asset tar entry for ${entryPath}`));
                    return;
                }
                data.stream.pipe(entry);
                entry.on('finish', ()=>{
                    callback(null);
                }).on('error', (error)=>{
                    callback(error);
                });
            }
        });
    }
    constructor(options){
        Object.defineProperty(this, _reportInfo, {
            value: reportInfo
        });
        Object.defineProperty(this, _archivePath, {
            get: get_archivePath,
            set: void 0
        });
        Object.defineProperty(this, _writeMetadata, {
            value: writeMetadata
        });
        Object.defineProperty(this, _getMetadataStream, {
            value: getMetadataStream
        });
        Object.defineProperty(this, _providersMetadata, {
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _archive, {
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _diagnostics, {
            writable: true,
            value: void 0
        });
        this.name = 'destination::local-file';
        this.type = 'destination';
        this.results = {};
        _class_private_field_loose_base(this, _providersMetadata)[_providersMetadata] = {};
        _class_private_field_loose_base(this, _archive)[_archive] = {};
        this.options = options;
    }
}
function reportInfo(message) {
    _class_private_field_loose_base(this, _diagnostics)[_diagnostics]?.report({
        details: {
            createdAt: new Date(),
            message,
            origin: 'file-destination-provider'
        },
        kind: 'info'
    });
}
function get_archivePath() {
    const { encryption, compression, file } = this.options;
    let filePath = `${file.path}.tar`;
    if (compression.enabled) {
        filePath += '.gz';
    }
    if (encryption.enabled) {
        filePath += '.enc';
    }
    return filePath;
}
async function writeMetadata() {
    _class_private_field_loose_base(this, _reportInfo)[_reportInfo]('writing metadata');
    const metadata = _class_private_field_loose_base(this, _providersMetadata)[_providersMetadata].source;
    if (metadata) {
        await new Promise((resolve)=>{
            const outStream = _class_private_field_loose_base(this, _getMetadataStream)[_getMetadataStream]();
            const data = JSON.stringify(metadata, null, 2);
            stream.Readable.from(data).pipe(outStream).on('close', resolve);
        });
    }
}
function getMetadataStream() {
    const { stream } = _class_private_field_loose_base(this, _archive)[_archive];
    if (!stream) {
        throw new Error('Archive stream is unavailable');
    }
    return utils.createTarEntryStream(stream, ()=>'metadata.json');
}

exports.createLocalFileDestinationProvider = createLocalFileDestinationProvider;
//# sourceMappingURL=index.js.map
