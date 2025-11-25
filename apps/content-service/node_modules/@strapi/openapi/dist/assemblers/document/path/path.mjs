import { createDebugger } from '../../../utils/debug.mjs';
import 'node:crypto';
import 'zod/v4';

const debug = createDebugger('assembler:paths');
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

export { DocumentPathsAssembler };
//# sourceMappingURL=path.mjs.map
