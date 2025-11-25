'use strict';

var stream = require('stream');
var streamChain = require('stream-chain');
var entities = require('./entities.js');
var links = require('./links.js');
var configuration = require('./configuration.js');
var assets = require('./assets.js');
require('crypto');
require('lodash/fp');
var schema = require('../../../utils/schema.js');
require('events');
var providers = require('../../../utils/providers.js');

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
const createLocalStrapiSourceProvider = (options)=>{
    return new LocalStrapiSourceProvider(options);
};
var _diagnostics = /*#__PURE__*/ _class_private_field_loose_key("_diagnostics"), _reportInfo = /*#__PURE__*/ _class_private_field_loose_key("_reportInfo"), /**
   * Reports an error to the diagnostic reporter.
   */ _reportError = /*#__PURE__*/ _class_private_field_loose_key("_reportError"), /**
   * Handles errors that occur in read streams.
   */ _handleStreamError = /*#__PURE__*/ _class_private_field_loose_key("_handleStreamError");
class LocalStrapiSourceProvider {
    async bootstrap(diagnostics) {
        _class_private_field_loose_base(this, _diagnostics)[_diagnostics] = diagnostics;
        this.strapi = await this.options.getStrapi();
        this.strapi.db.lifecycles.disable();
    }
    async close() {
        const { autoDestroy } = this.options;
        providers.assertValidStrapi(this.strapi);
        this.strapi.db.lifecycles.enable();
        // Basically `!== false` but more deterministic
        if (autoDestroy === undefined || autoDestroy === true) {
            await this.strapi?.destroy();
        }
    }
    getMetadata() {
        _class_private_field_loose_base(this, _reportInfo)[_reportInfo]('getting metadata');
        const strapiVersion = strapi.config.get('info.strapi');
        const createdAt = new Date().toISOString();
        return {
            createdAt,
            strapi: {
                version: strapiVersion
            }
        };
    }
    async createEntitiesReadStream() {
        providers.assertValidStrapi(this.strapi, 'Not able to stream entities');
        _class_private_field_loose_base(this, _reportInfo)[_reportInfo]('creating entities read stream');
        return streamChain.chain([
            // Entities stream
            entities.createEntitiesStream(this.strapi),
            // Transform stream
            entities.createEntitiesTransformStream()
        ]);
    }
    createLinksReadStream() {
        providers.assertValidStrapi(this.strapi, 'Not able to stream links');
        _class_private_field_loose_base(this, _reportInfo)[_reportInfo]('creating links read stream');
        return links.createLinksStream(this.strapi);
    }
    createConfigurationReadStream() {
        providers.assertValidStrapi(this.strapi, 'Not able to stream configuration');
        _class_private_field_loose_base(this, _reportInfo)[_reportInfo]('creating configuration read stream');
        return configuration.createConfigurationStream(this.strapi);
    }
    getSchemas() {
        providers.assertValidStrapi(this.strapi, 'Not able to get Schemas');
        _class_private_field_loose_base(this, _reportInfo)[_reportInfo]('getting schemas');
        const schemas = schema.schemasToValidJSON({
            ...this.strapi.contentTypes,
            ...this.strapi.components
        });
        return schema.mapSchemasValues(schemas);
    }
    createSchemasReadStream() {
        return stream.Readable.from(Object.values(this.getSchemas()));
    }
    createAssetsReadStream() {
        providers.assertValidStrapi(this.strapi, 'Not able to stream assets');
        _class_private_field_loose_base(this, _reportInfo)[_reportInfo]('creating assets read stream');
        const stream = assets.createAssetsStream(this.strapi);
        stream.on('error', (err)=>{
            _class_private_field_loose_base(this, _handleStreamError)[_handleStreamError]('assets', err);
        });
        return stream;
    }
    constructor(options){
        Object.defineProperty(this, _reportInfo, {
            value: reportInfo
        });
        Object.defineProperty(this, _reportError, {
            value: reportError
        });
        Object.defineProperty(this, _handleStreamError, {
            value: handleStreamError
        });
        Object.defineProperty(this, _diagnostics, {
            writable: true,
            value: void 0
        });
        this.name = 'source::local-strapi';
        this.type = 'source';
        this.options = options;
    }
}
function reportInfo(message) {
    _class_private_field_loose_base(this, _diagnostics)[_diagnostics]?.report({
        details: {
            createdAt: new Date(),
            message,
            origin: 'local-source-provider'
        },
        kind: 'info'
    });
}
function reportError(message, error) {
    _class_private_field_loose_base(this, _diagnostics)[_diagnostics]?.report({
        details: {
            createdAt: new Date(),
            message,
            error,
            severity: 'fatal',
            name: error.name
        },
        kind: 'error'
    });
}
function handleStreamError(streamType, err) {
    const { message, stack } = err;
    const errorMessage = `[Data transfer] Error in ${streamType} read stream: ${message}`;
    const formattedError = {
        message: errorMessage,
        stack,
        timestamp: new Date().toISOString()
    };
    this.strapi?.log.error(formattedError);
    _class_private_field_loose_base(this, _reportError)[_reportError](formattedError.message, err);
}

exports.createLocalStrapiSourceProvider = createLocalStrapiSourceProvider;
//# sourceMappingURL=index.js.map
