'use strict';

var stream = require('stream');
var path = require('path');
var fse = require('fs-extra');
var index = require('./strategies/restore/index.js');
require('crypto');
require('lodash/fp');
var schema = require('../../../utils/schema.js');
var transaction = require('../../../utils/transaction.js');
require('events');
var providers = require('../../../errors/providers.js');
var providers$1 = require('../../../utils/providers.js');
var entities = require('./strategies/restore/entities.js');
var configuration = require('./strategies/restore/configuration.js');
var links = require('./strategies/restore/links.js');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var fse__namespace = /*#__PURE__*/_interopNamespaceDefault(fse);

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
const VALID_CONFLICT_STRATEGIES = [
    'restore'
];
const DEFAULT_CONFLICT_STRATEGY = 'restore';
var _diagnostics = /*#__PURE__*/ _class_private_field_loose_key("_diagnostics"), /**
   * The entities mapper is used to map old entities to their new IDs
   */ _entitiesMapper = /*#__PURE__*/ _class_private_field_loose_key("_entitiesMapper"), // TODO: either move this to restore strategy, or restore strategy should given access to these instead of repeating the logic possibly in a different way
_areAssetsIncluded = /*#__PURE__*/ _class_private_field_loose_key("_areAssetsIncluded"), _isContentTypeIncluded = /*#__PURE__*/ _class_private_field_loose_key("_isContentTypeIncluded"), _reportInfo = /*#__PURE__*/ _class_private_field_loose_key("_reportInfo"), _validateOptions = /*#__PURE__*/ _class_private_field_loose_key("_validateOptions"), _deleteFromRestoreOptions = /*#__PURE__*/ _class_private_field_loose_key("_deleteFromRestoreOptions"), _deleteAllAssets = /*#__PURE__*/ _class_private_field_loose_key("_deleteAllAssets"), _handleAssetsBackup = /*#__PURE__*/ _class_private_field_loose_key("_handleAssetsBackup"), _removeAssetsBackup = /*#__PURE__*/ _class_private_field_loose_key("_removeAssetsBackup");
class LocalStrapiDestinationProvider {
    async bootstrap(diagnostics) {
        _class_private_field_loose_base(this, _diagnostics)[_diagnostics] = diagnostics;
        _class_private_field_loose_base(this, _validateOptions)[_validateOptions]();
        this.strapi = await this.options.getStrapi();
        if (!this.strapi) {
            throw new providers.ProviderInitializationError('Could not access local strapi');
        }
        this.strapi.db.lifecycles.disable();
        this.transaction = transaction.createTransaction(this.strapi);
    }
    async close() {
        const { autoDestroy } = this.options;
        providers$1.assertValidStrapi(this.strapi);
        this.transaction?.end();
        this.strapi.db.lifecycles.enable();
        // Basically `!== false` but more deterministic
        if (autoDestroy === undefined || autoDestroy === true) {
            await this.strapi?.destroy();
        }
    }
    async rollback() {
        _class_private_field_loose_base(this, _reportInfo)[_reportInfo]('Rolling back transaction');
        await this.transaction?.rollback();
        _class_private_field_loose_base(this, _reportInfo)[_reportInfo]('Rolled back transaction');
    }
    async beforeTransfer() {
        if (!this.strapi) {
            throw new Error('Strapi instance not found');
        }
        await this.transaction?.attach(async (trx)=>{
            try {
                if (this.options.strategy === 'restore') {
                    await _class_private_field_loose_base(this, _handleAssetsBackup)[_handleAssetsBackup]();
                    await _class_private_field_loose_base(this, _deleteAllAssets)[_deleteAllAssets](trx);
                    await _class_private_field_loose_base(this, _deleteFromRestoreOptions)[_deleteFromRestoreOptions]();
                }
            } catch (error) {
                throw new Error(`restore failed ${error}`);
            }
        });
    }
    getMetadata() {
        _class_private_field_loose_base(this, _reportInfo)[_reportInfo]('getting metadata');
        providers$1.assertValidStrapi(this.strapi, 'Not able to get Schemas');
        const strapiVersion = this.strapi.config.get('info.strapi');
        const createdAt = new Date().toISOString();
        return {
            createdAt,
            strapi: {
                version: strapiVersion
            }
        };
    }
    getSchemas() {
        _class_private_field_loose_base(this, _reportInfo)[_reportInfo]('getting schema');
        providers$1.assertValidStrapi(this.strapi, 'Not able to get Schemas');
        const schemas = schema.schemasToValidJSON({
            ...this.strapi.contentTypes,
            ...this.strapi.components
        });
        return schema.mapSchemasValues(schemas);
    }
    createEntitiesWriteStream() {
        providers$1.assertValidStrapi(this.strapi, 'Not able to import entities');
        _class_private_field_loose_base(this, _reportInfo)[_reportInfo]('creating entities stream');
        const { strategy } = this.options;
        const updateMappingTable = (type, oldID, newID)=>{
            if (!_class_private_field_loose_base(this, _entitiesMapper)[_entitiesMapper][type]) {
                _class_private_field_loose_base(this, _entitiesMapper)[_entitiesMapper][type] = {};
            }
            Object.assign(_class_private_field_loose_base(this, _entitiesMapper)[_entitiesMapper][type], {
                [oldID]: newID
            });
        };
        if (strategy === 'restore') {
            return entities.createEntitiesWriteStream({
                strapi: this.strapi,
                updateMappingTable,
                transaction: this.transaction
            });
        }
        throw new providers.ProviderValidationError(`Invalid strategy ${this.options.strategy}`, {
            check: 'strategy',
            strategy: this.options.strategy,
            validStrategies: VALID_CONFLICT_STRATEGIES
        });
    }
    // TODO: Move this logic to the restore strategy
    async createAssetsWriteStream() {
        providers$1.assertValidStrapi(this.strapi, 'Not able to stream Assets');
        _class_private_field_loose_base(this, _reportInfo)[_reportInfo]('creating assets write stream');
        if (!_class_private_field_loose_base(this, _areAssetsIncluded)[_areAssetsIncluded]()) {
            throw new providers.ProviderTransferError('Attempting to transfer assets when `assets` is not set in restore options');
        }
        const removeAssetsBackup = _class_private_field_loose_base(this, _removeAssetsBackup)[_removeAssetsBackup].bind(this);
        const strapi = this.strapi;
        const transaction = this.transaction;
        const fileEntitiesMapper = _class_private_field_loose_base(this, _entitiesMapper)[_entitiesMapper]['plugin::upload.file'];
        const restoreMediaEntitiesContent = _class_private_field_loose_base(this, _isContentTypeIncluded)[_isContentTypeIncluded]('plugin::upload.file');
        return new stream.Writable({
            objectMode: true,
            async final (next) {
                // Delete the backup folder
                await removeAssetsBackup();
                next();
            },
            async write (chunk, _encoding, callback) {
                await transaction?.attach(async ()=>{
                    const uploadData = {
                        ...chunk.metadata,
                        stream: stream.Readable.from(chunk.stream),
                        buffer: chunk?.buffer
                    };
                    const provider = strapi.config.get('plugin::upload').provider;
                    const fileId = fileEntitiesMapper?.[uploadData.id];
                    if (!fileId) {
                        return callback(new Error(`File ID not found for ID: ${uploadData.id}`));
                    }
                    try {
                        await strapi.plugin('upload').provider.uploadStream(uploadData);
                        // if we're not supposed to transfer the associated entities, stop here
                        if (!restoreMediaEntitiesContent) {
                            return callback();
                        }
                        // Files formats are stored within the parent file entity
                        if (uploadData?.type) {
                            const entry = await strapi.db.query('plugin::upload.file').findOne({
                                where: {
                                    id: fileId
                                }
                            });
                            if (!entry) {
                                throw new Error('file not found');
                            }
                            const specificFormat = entry?.formats?.[uploadData.type];
                            if (specificFormat) {
                                specificFormat.url = uploadData.url;
                            }
                            await strapi.db.query('plugin::upload.file').update({
                                where: {
                                    id: entry.id
                                },
                                data: {
                                    formats: entry.formats,
                                    provider
                                }
                            });
                            return callback();
                        }
                        const entry = await strapi.db.query('plugin::upload.file').findOne({
                            where: {
                                id: fileId
                            }
                        });
                        if (!entry) {
                            throw new Error('file not found');
                        }
                        entry.url = uploadData.url;
                        await strapi.db.query('plugin::upload.file').update({
                            where: {
                                id: entry.id
                            },
                            data: {
                                url: entry.url,
                                provider
                            }
                        });
                        return callback();
                    } catch (error) {
                        return callback(new Error(`Error while uploading asset ${chunk.filename} ${error}`));
                    }
                });
            }
        });
    }
    async createConfigurationWriteStream() {
        providers$1.assertValidStrapi(this.strapi, 'Not able to stream Configurations');
        _class_private_field_loose_base(this, _reportInfo)[_reportInfo]('creating configuration write stream');
        const { strategy } = this.options;
        if (strategy === 'restore') {
            return configuration.createConfigurationWriteStream(this.strapi, this.transaction);
        }
        throw new providers.ProviderValidationError(`Invalid strategy ${strategy}`, {
            check: 'strategy',
            strategy,
            validStrategies: VALID_CONFLICT_STRATEGIES
        });
    }
    async createLinksWriteStream() {
        _class_private_field_loose_base(this, _reportInfo)[_reportInfo]('creating links write stream');
        if (!this.strapi) {
            throw new Error('Not able to stream links. Strapi instance not found');
        }
        const { strategy } = this.options;
        const mapID = (uid, id)=>_class_private_field_loose_base(this, _entitiesMapper)[_entitiesMapper][uid]?.[id];
        if (strategy === 'restore') {
            return links.createLinksWriteStream(mapID, this.strapi, this.transaction, this.onWarning);
        }
        throw new providers.ProviderValidationError(`Invalid strategy ${strategy}`, {
            check: 'strategy',
            strategy,
            validStrategies: VALID_CONFLICT_STRATEGIES
        });
    }
    constructor(options){
        Object.defineProperty(this, _reportInfo, {
            value: reportInfo
        });
        Object.defineProperty(this, _validateOptions, {
            value: validateOptions
        });
        Object.defineProperty(this, _deleteFromRestoreOptions, {
            value: deleteFromRestoreOptions
        });
        Object.defineProperty(this, _deleteAllAssets, {
            value: deleteAllAssets
        });
        Object.defineProperty(this, _handleAssetsBackup, {
            value: handleAssetsBackup
        });
        Object.defineProperty(this, _removeAssetsBackup, {
            value: removeAssetsBackup
        });
        Object.defineProperty(this, _diagnostics, {
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _entitiesMapper, {
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _areAssetsIncluded, {
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, _isContentTypeIncluded, {
            writable: true,
            value: void 0
        });
        this.name = 'destination::local-strapi';
        this.type = 'destination';
        _class_private_field_loose_base(this, _areAssetsIncluded)[_areAssetsIncluded] = ()=>{
            return this.options.restore?.assets;
        };
        _class_private_field_loose_base(this, _isContentTypeIncluded)[_isContentTypeIncluded] = (type)=>{
            const notIncluded = this.options.restore?.entities?.include && !this.options.restore?.entities?.include?.includes(type);
            const excluded = this.options.restore?.entities?.exclude && this.options.restore?.entities.exclude.includes(type);
            return !excluded && !notIncluded;
        };
        this.options = options;
        _class_private_field_loose_base(this, _entitiesMapper)[_entitiesMapper] = {};
        this.uploadsBackupDirectoryName = `uploads_backup_${Date.now()}`;
    }
}
function reportInfo(message) {
    _class_private_field_loose_base(this, _diagnostics)[_diagnostics]?.report({
        details: {
            createdAt: new Date(),
            message,
            origin: 'local-destination-provider'
        },
        kind: 'info'
    });
}
function validateOptions() {
    _class_private_field_loose_base(this, _reportInfo)[_reportInfo]('validating options');
    if (!VALID_CONFLICT_STRATEGIES.includes(this.options.strategy)) {
        throw new providers.ProviderValidationError(`Invalid strategy ${this.options.strategy}`, {
            check: 'strategy',
            strategy: this.options.strategy,
            validStrategies: VALID_CONFLICT_STRATEGIES
        });
    }
    // require restore options when using restore
    if (this.options.strategy === 'restore' && !this.options.restore) {
        throw new providers.ProviderValidationError('Missing restore options');
    }
}
async function deleteFromRestoreOptions() {
    providers$1.assertValidStrapi(this.strapi);
    if (!this.options.restore) {
        throw new providers.ProviderValidationError('Missing restore options');
    }
    _class_private_field_loose_base(this, _reportInfo)[_reportInfo]('deleting record ');
    return index.deleteRecords(this.strapi, this.options.restore);
}
async function deleteAllAssets(trx) {
    providers$1.assertValidStrapi(this.strapi);
    _class_private_field_loose_base(this, _reportInfo)[_reportInfo]('deleting all assets');
    // if we're not restoring files, don't touch the files
    if (!_class_private_field_loose_base(this, _areAssetsIncluded)[_areAssetsIncluded]()) {
        return;
    }
    const stream = this.strapi.db// Create a query builder instance (default type is 'select')
    .queryBuilder('plugin::upload.file')// Fetch all columns
    .select('*')// Attach the transaction
    .transacting(trx)// Get a readable stream
    .stream();
    // TODO use bulk delete when exists in providers
    for await (const file of stream){
        await this.strapi.plugin('upload').provider.delete(file);
        if (file.formats) {
            for (const fileFormat of Object.values(file.formats)){
                await this.strapi.plugin('upload').provider.delete(fileFormat);
            }
        }
    }
    _class_private_field_loose_base(this, _reportInfo)[_reportInfo]('deleted all assets');
}
async function handleAssetsBackup() {
    providers$1.assertValidStrapi(this.strapi, 'Not able to create the assets backup');
    // if we're not restoring assets, don't back them up because they won't be touched
    if (!_class_private_field_loose_base(this, _areAssetsIncluded)[_areAssetsIncluded]()) {
        return;
    }
    if (this.strapi.config.get('plugin::upload').provider === 'local') {
        _class_private_field_loose_base(this, _reportInfo)[_reportInfo]('creating assets backup directory');
        const assetsDirectory = path.join(this.strapi.dirs.static.public, 'uploads');
        const backupDirectory = path.join(this.strapi.dirs.static.public, this.uploadsBackupDirectoryName);
        try {
            // Check access before attempting to do anything
            await fse__namespace.access(assetsDirectory, // eslint-disable-next-line no-bitwise
            fse__namespace.constants.W_OK | fse__namespace.constants.R_OK | fse__namespace.constants.F_OK);
            // eslint-disable-next-line no-bitwise
            await fse__namespace.access(path.join(assetsDirectory, '..'), fse__namespace.constants.W_OK | fse__namespace.constants.R_OK);
            await fse__namespace.move(assetsDirectory, backupDirectory);
            await fse__namespace.mkdir(assetsDirectory);
            // Create a .gitkeep file to ensure the directory is not empty
            await fse__namespace.outputFile(path.join(assetsDirectory, '.gitkeep'), '');
            _class_private_field_loose_base(this, _reportInfo)[_reportInfo](`created assets backup directory ${backupDirectory}`);
        } catch (err) {
            throw new providers.ProviderTransferError('The backup folder for the assets could not be created inside the public folder. Please ensure Strapi has write permissions on the public directory', {
                code: 'ASSETS_DIRECTORY_ERR'
            });
        }
        return backupDirectory;
    }
}
async function removeAssetsBackup() {
    providers$1.assertValidStrapi(this.strapi, 'Not able to remove Assets');
    // if we're not restoring assets, don't back them up because they won't be touched
    if (!_class_private_field_loose_base(this, _areAssetsIncluded)[_areAssetsIncluded]()) {
        return;
    }
    // TODO: this should catch all thrown errors and bubble it up to engine so it can be reported as a non-fatal diagnostic message telling the user they may need to manually delete assets
    if (this.strapi.config.get('plugin::upload').provider === 'local') {
        _class_private_field_loose_base(this, _reportInfo)[_reportInfo]('removing assets backup');
        providers$1.assertValidStrapi(this.strapi);
        const backupDirectory = path.join(this.strapi.dirs.static.public, this.uploadsBackupDirectoryName);
        await fse__namespace.rm(backupDirectory, {
            recursive: true,
            force: true
        });
        _class_private_field_loose_base(this, _reportInfo)[_reportInfo]('successfully removed assets backup');
    }
}
const createLocalStrapiDestinationProvider = (options)=>{
    return new LocalStrapiDestinationProvider(options);
};

exports.DEFAULT_CONFLICT_STRATEGY = DEFAULT_CONFLICT_STRATEGY;
exports.VALID_CONFLICT_STRATEGIES = VALID_CONFLICT_STRATEGIES;
exports.createLocalStrapiDestinationProvider = createLocalStrapiDestinationProvider;
//# sourceMappingURL=index.js.map
