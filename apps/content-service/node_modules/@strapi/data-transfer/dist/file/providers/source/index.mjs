import zip from 'zlib';
import path from 'path';
import { PassThrough, pipeline } from 'stream';
import fse__default from 'fs-extra';
import tar from 'tar';
import { isEmpty, keyBy } from 'lodash/fp';
import { chain } from 'stream-chain';
import { parser } from 'stream-json/jsonl/Parser';
import 'crypto';
import { createDecryptionCipher } from '../../../utils/encryption/decrypt.mjs';
import { collect } from '../../../utils/stream.mjs';
import { schemasToValidJSON } from '../../../utils/schema.mjs';
import 'events';
import { ProviderInitializationError, ProviderTransferError } from '../../../errors/providers.mjs';
import { isFilePathInDirname, unknownPathToPosix, isPathEquivalent } from './utils.mjs';

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
/**
 * Constant for the metadata file path
 */ const METADATA_FILE_PATH = 'metadata.json';
const createLocalFileSourceProvider = (options)=>{
    return new LocalFileSourceProvider(options);
};
var _metadata = /*#__PURE__*/ _class_private_field_loose_key("_metadata"), _diagnostics = /*#__PURE__*/ _class_private_field_loose_key("_diagnostics"), _reportInfo = /*#__PURE__*/ _class_private_field_loose_key("_reportInfo"), _loadMetadata = /*#__PURE__*/ _class_private_field_loose_key("_loadMetadata"), _loadAssetMetadata = /*#__PURE__*/ _class_private_field_loose_key("_loadAssetMetadata"), _getBackupStream = /*#__PURE__*/ _class_private_field_loose_key("_getBackupStream"), // `directory` must be posix formatted path
_streamJsonlDirectory = /*#__PURE__*/ _class_private_field_loose_key("_streamJsonlDirectory"), _parseJSONFile = /*#__PURE__*/ _class_private_field_loose_key("_parseJSONFile");
class LocalFileSourceProvider {
    /**
   * Pre flight checks regarding the provided options, making sure that the file can be opened (decrypted, decompressed), etc.
   */ async bootstrap(diagnostics) {
        _class_private_field_loose_base(this, _diagnostics)[_diagnostics] = diagnostics;
        const { path: filePath } = this.options.file;
        try {
            // Read the metadata to ensure the file can be parsed
            await _class_private_field_loose_base(this, _loadMetadata)[_loadMetadata]();
        // TODO: we might also need to read the schema.jsonl files & implements a custom stream-check
        } catch (e) {
            if (this.options?.encryption?.enabled) {
                throw new ProviderInitializationError(`Key is incorrect or the file '${filePath}' is not a valid Strapi data file.`);
            }
            throw new ProviderInitializationError(`File '${filePath}' is not a valid Strapi data file.`);
        }
        if (!_class_private_field_loose_base(this, _metadata)[_metadata]) {
            throw new ProviderInitializationError('Could not load metadata from Strapi data file.');
        }
    }
    async getMetadata() {
        _class_private_field_loose_base(this, _reportInfo)[_reportInfo]('getting metadata');
        if (!_class_private_field_loose_base(this, _metadata)[_metadata]) {
            await _class_private_field_loose_base(this, _loadMetadata)[_loadMetadata]();
        }
        return _class_private_field_loose_base(this, _metadata)[_metadata] ?? null;
    }
    async getSchemas() {
        _class_private_field_loose_base(this, _reportInfo)[_reportInfo]('getting schemas');
        const schemaCollection = await collect(this.createSchemasReadStream());
        if (isEmpty(schemaCollection)) {
            throw new ProviderInitializationError('Could not load schemas from Strapi data file.');
        }
        // Group schema by UID
        const schemas = keyBy('uid', schemaCollection);
        // Transform to valid JSON
        return schemasToValidJSON(schemas);
    }
    createEntitiesReadStream() {
        _class_private_field_loose_base(this, _reportInfo)[_reportInfo]('creating entities read stream');
        return _class_private_field_loose_base(this, _streamJsonlDirectory)[_streamJsonlDirectory]('entities');
    }
    createSchemasReadStream() {
        _class_private_field_loose_base(this, _reportInfo)[_reportInfo]('creating schemas read stream');
        return _class_private_field_loose_base(this, _streamJsonlDirectory)[_streamJsonlDirectory]('schemas');
    }
    createLinksReadStream() {
        _class_private_field_loose_base(this, _reportInfo)[_reportInfo]('creating links read stream');
        return _class_private_field_loose_base(this, _streamJsonlDirectory)[_streamJsonlDirectory]('links');
    }
    createConfigurationReadStream() {
        _class_private_field_loose_base(this, _reportInfo)[_reportInfo]('creating configuration read stream');
        // NOTE: TBD
        return _class_private_field_loose_base(this, _streamJsonlDirectory)[_streamJsonlDirectory]('configuration');
    }
    createAssetsReadStream() {
        const inStream = _class_private_field_loose_base(this, _getBackupStream)[_getBackupStream]();
        const outStream = new PassThrough({
            objectMode: true
        });
        const loadAssetMetadata = _class_private_field_loose_base(this, _loadAssetMetadata)[_loadAssetMetadata].bind(this);
        _class_private_field_loose_base(this, _reportInfo)[_reportInfo]('creating assets read stream');
        pipeline([
            inStream,
            new tar.Parse({
                // find only files in the assets/uploads folder
                filter (filePath, entry) {
                    if (entry.type !== 'File') {
                        return false;
                    }
                    return isFilePathInDirname('assets/uploads', filePath);
                },
                async onentry (entry) {
                    const { path: filePath, size = 0 } = entry;
                    const normalizedPath = unknownPathToPosix(filePath);
                    const file = path.basename(normalizedPath);
                    let metadata;
                    try {
                        metadata = await loadAssetMetadata(`assets/metadata/${file}.json`);
                    } catch (error) {
                        throw new Error(`Failed to read metadata for ${file}`);
                    }
                    const asset = {
                        metadata,
                        filename: file,
                        filepath: normalizedPath,
                        stats: {
                            size
                        },
                        stream: entry
                    };
                    outStream.write(asset);
                }
            })
        ], ()=>outStream.end());
        return outStream;
    }
    constructor(options){
        Object.defineProperty(this, _reportInfo, {
            value: reportInfo
        });
        Object.defineProperty(this, _loadMetadata, {
            value: loadMetadata
        });
        Object.defineProperty(this, _loadAssetMetadata, {
            value: loadAssetMetadata
        });
        Object.defineProperty(this, _getBackupStream, {
            value: getBackupStream
        });
        Object.defineProperty(this, _streamJsonlDirectory, {
            value: streamJsonlDirectory
        });
        // For collecting an entire JSON file then parsing it, not for streaming JSONL
        Object.defineProperty(this, _parseJSONFile, {
            value: parseJSONFile
        });
        Object.defineProperty(this, _metadata, {
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _diagnostics, {
            writable: true,
            value: void 0
        });
        this.type = 'source';
        this.name = 'source::local-file';
        this.options = options;
        const { encryption } = this.options;
        if (encryption.enabled && encryption.key === undefined) {
            throw new Error('Missing encryption key');
        }
    }
}
function reportInfo(message) {
    _class_private_field_loose_base(this, _diagnostics)[_diagnostics]?.report({
        details: {
            createdAt: new Date(),
            message,
            origin: 'file-source-provider'
        },
        kind: 'info'
    });
}
async function loadMetadata() {
    const backupStream = _class_private_field_loose_base(this, _getBackupStream)[_getBackupStream]();
    _class_private_field_loose_base(this, _metadata)[_metadata] = await _class_private_field_loose_base(this, _parseJSONFile)[_parseJSONFile](backupStream, METADATA_FILE_PATH);
}
async function loadAssetMetadata(path) {
    const backupStream = _class_private_field_loose_base(this, _getBackupStream)[_getBackupStream]();
    return _class_private_field_loose_base(this, _parseJSONFile)[_parseJSONFile](backupStream, path);
}
function getBackupStream() {
    const { file, encryption, compression } = this.options;
    const streams = [];
    try {
        streams.push(fse__default.createReadStream(file.path));
    } catch (e) {
        throw new Error(`Could not read backup file path provided at "${this.options.file.path}"`);
    }
    if (encryption.enabled && encryption.key) {
        streams.push(createDecryptionCipher(encryption.key));
    }
    if (compression.enabled) {
        streams.push(zip.createGunzip());
    }
    return chain(streams);
}
function streamJsonlDirectory(directory) {
    const inStream = _class_private_field_loose_base(this, _getBackupStream)[_getBackupStream]();
    const outStream = new PassThrough({
        objectMode: true
    });
    pipeline([
        inStream,
        new tar.Parse({
            filter (filePath, entry) {
                if (entry.type !== 'File') {
                    return false;
                }
                return isFilePathInDirname(directory, filePath);
            },
            async onentry (entry) {
                const transforms = [
                    // JSONL parser to read the data chunks one by one (line by line)
                    parser({
                        checkErrors: true
                    }),
                    // The JSONL parser returns each line as key/value
                    (line)=>line.value
                ];
                const stream = entry.pipe(chain(transforms));
                try {
                    for await (const chunk of stream){
                        outStream.write(chunk);
                    }
                } catch (e) {
                    outStream.destroy(new ProviderTransferError(`Error parsing backup files from backup file ${entry.path}: ${e.message}`, {
                        details: {
                            error: e
                        }
                    }));
                }
            }
        })
    ], async ()=>{
        // Manually send the 'end' event to the out stream
        // once every entry has finished streaming its content
        outStream.end();
    });
    return outStream;
}
async function parseJSONFile(fileStream, filePath) {
    return new Promise((resolve, reject)=>{
        pipeline([
            fileStream,
            // Custom backup archive parsing
            new tar.Parse({
                /**
             * Filter the parsed entries to only keep the one that matches the given filepath
             */ filter (entryPath, entry) {
                    if (entry.type !== 'File') {
                        return false;
                    }
                    return isPathEquivalent(entryPath, filePath);
                },
                async onentry (entry) {
                    // Collect all the content of the entry file
                    const content = await entry.collect();
                    try {
                        // Parse from buffer array to string to JSON
                        const parsedContent = JSON.parse(Buffer.concat(content).toString());
                        // Resolve the Promise with the parsed content
                        resolve(parsedContent);
                    } catch (e) {
                        reject(e);
                    } finally{
                        // Cleanup (close the stream associated to the entry)
                        entry.destroy();
                    }
                }
            })
        ], ()=>{
            // If the promise hasn't been resolved and we've parsed all
            // the archive entries, then the file doesn't exist
            reject(new Error(`File "${filePath}" not found`));
        });
    });
}

export { createLocalFileSourceProvider };
//# sourceMappingURL=index.mjs.map
