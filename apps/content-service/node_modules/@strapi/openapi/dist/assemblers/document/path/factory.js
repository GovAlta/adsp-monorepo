'use strict';

require('debug');
require('node:crypto');
require('zod/v4');
var pathItem$1 = require('../../../context/factories/path-item.js');
var pathItem = require('./path-item/path-item.js');
var factory = require('./path-item/factory.js');
require('./path-item/operation/operation.js');
require('./path-item/operation/operation-id.js');
require('./path-item/operation/parameters.js');
require('./path-item/operation/tags.js');

class PathAssemblerFactory {
    createAll() {
        return [
            this._createPathItemAssembler()
        ];
    }
    _createPathItemAssembler(assemblerFactory = new factory.PathItemAssemblerFactory(), contextFactory = new pathItem$1.PathItemContextFactory()) {
        const assemblers = assemblerFactory.createAll();
        return new pathItem.PathItemAssembler(assemblers, contextFactory);
    }
}

exports.PathAssemblerFactory = PathAssemblerFactory;
//# sourceMappingURL=factory.js.map
