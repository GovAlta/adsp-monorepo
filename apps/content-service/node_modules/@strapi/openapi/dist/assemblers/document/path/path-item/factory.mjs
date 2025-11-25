import 'debug';
import 'node:crypto';
import 'zod/v4';
import { OperationContextFactory } from '../../../../context/factories/operation.mjs';
import { OperationAssembler } from './operation/operation.mjs';
import { OperationAssemblerFactory } from './operation/factory.mjs';
import './operation/parameters.mjs';
import './operation/operation-id.mjs';
import './operation/tags.mjs';

class PathItemAssemblerFactory {
    createAll() {
        return [
            this._createOperationAssembler()
        ];
    }
    _createOperationAssembler(assemblerFactory = new OperationAssemblerFactory(), contextFactory = new OperationContextFactory()) {
        const assemblers = assemblerFactory.createAll();
        return new OperationAssembler(assemblers, contextFactory);
    }
}

export { PathItemAssemblerFactory };
//# sourceMappingURL=factory.mjs.map
