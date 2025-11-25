'use strict';

var debug$1 = require('../../../utils/debug.js');
require('node:crypto');
require('zod/v4');

const debug = debug$1.createDebugger('assembler:paths');
class DocumentPathsAssembler {
    assemble(context) {
        const { output, ...defaultContextProps } = context;
        debug(`assembling document's paths for %O routes...`, defaultContextProps.routes.length);
        const pathContext = this._contextFactory.create(defaultContextProps);
        for (const assembler of this._assemblers){
            assembler.assemble(pathContext);
        }
        const { data: pathsObject } = pathContext.output;
        const nbUniquePaths = Object.keys(pathsObject).length;
        debug(`document's paths assembled, added %O unique paths`, nbUniquePaths);
        output.data.paths = pathsObject;
    }
    constructor(assemblers, _contextFactory){
        this._assemblers = assemblers;
        this._contextFactory = _contextFactory;
    }
}

exports.DocumentPathsAssembler = DocumentPathsAssembler;
//# sourceMappingURL=path.js.map
