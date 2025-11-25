import 'debug';
import 'node:crypto';
import 'zod/v4';
import { PathItemContextFactory } from '../../../context/factories/path-item.mjs';
import { PathItemAssembler } from './path-item/path-item.mjs';
import { PathItemAssemblerFactory } from './path-item/factory.mjs';
import './path-item/operation/operation.mjs';
import './path-item/operation/operation-id.mjs';
import './path-item/operation/parameters.mjs';
import './path-item/operation/tags.mjs';

class PathAssemblerFactory {
    createAll() {
        return [
            this._createPathItemAssembler()
        ];
    }
    _createPathItemAssembler(assemblerFactory = new PathItemAssemblerFactory(), contextFactory = new PathItemContextFactory()) {
        const assemblers = assemblerFactory.createAll();
        return new PathItemAssembler(assemblers, contextFactory);
    }
}

export { PathAssemblerFactory };
//# sourceMappingURL=factory.mjs.map
