import { createDebugger } from '../../../../../utils/debug.mjs';
import 'node:crypto';
import 'zod/v4';

const debug = createDebugger('assembler:tags');
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

export { OperationTagsAssembler };
//# sourceMappingURL=tags.mjs.map
