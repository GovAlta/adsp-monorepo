'use strict';

var debug$1 = require('../../../../../utils/debug.js');
require('node:crypto');
require('zod/v4');

const debug = debug$1.createDebugger('assembler:tags');
class OperationTagsAssembler {
    assemble(context, route) {
        const { method, path, info: { apiName, pluginName } } = route;
        debug('assembling tags for %o %o...', method, path);
        const tags = [];
        if (apiName) {
            tags.push(apiName);
        }
        if (pluginName) {
            tags.push(pluginName);
        }
        debug('assembled %o tags for %o %o: %o', tags.length, method, path, tags);
        context.output.data.tags = tags;
    }
}

exports.OperationTagsAssembler = OperationTagsAssembler;
//# sourceMappingURL=tags.js.map
