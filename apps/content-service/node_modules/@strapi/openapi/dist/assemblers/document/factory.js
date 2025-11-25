'use strict';

require('debug');
require('node:crypto');
require('zod/v4');
var path$1 = require('../../context/factories/path.js');
var info = require('./info.js');
var metadata = require('./metadata.js');
var path = require('./path/path.js');
var factory = require('./path/factory.js');
require('./path/path-item/path-item.js');
require('./path/path-item/operation/operation.js');
require('./path/path-item/operation/operation-id.js');
require('./path/path-item/operation/parameters.js');
require('./path/path-item/operation/tags.js');

class DocumentAssemblerFactory {
    createAll() {
        return [
            this._createMetadataAssembler(),
            this._createInfoAssembler(),
            this._createPathsAssembler()
        ];
    }
    _createInfoAssembler() {
        return new info.DocumentInfoAssembler();
    }
    _createMetadataAssembler() {
        return new metadata.DocumentMetadataAssembler();
    }
    _createPathsAssembler(assemblerFactory = new factory.PathAssemblerFactory(), contextFactory = new path$1.PathContextFactory()) {
        const assemblers = assemblerFactory.createAll();
        return new path.DocumentPathsAssembler(assemblers, contextFactory);
    }
}

exports.DocumentAssemblerFactory = DocumentAssemblerFactory;
//# sourceMappingURL=factory.js.map
