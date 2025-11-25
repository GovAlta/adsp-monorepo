'use strict';

require('debug');
require('node:crypto');
require('zod/v4');
var operation$1 = require('../../../../context/factories/operation.js');
var operation = require('./operation/operation.js');
var factory = require('./operation/factory.js');
require('./operation/parameters.js');
require('./operation/operation-id.js');
require('./operation/tags.js');

class PathItemAssemblerFactory {
    createAll() {
        return [
            this._createOperationAssembler()
        ];
    }
    _createOperationAssembler(assemblerFactory = new factory.OperationAssemblerFactory(), contextFactory = new operation$1.OperationContextFactory()) {
        const assemblers = assemblerFactory.createAll();
        return new operation.OperationAssembler(assemblers, contextFactory);
    }
}

exports.PathItemAssemblerFactory = PathItemAssemblerFactory;
//# sourceMappingURL=factory.js.map
