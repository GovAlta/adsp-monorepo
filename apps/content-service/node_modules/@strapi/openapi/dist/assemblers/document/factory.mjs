import 'debug';
import 'node:crypto';
import 'zod/v4';
import { PathContextFactory } from '../../context/factories/path.mjs';
import { DocumentInfoAssembler } from './info.mjs';
import { DocumentMetadataAssembler } from './metadata.mjs';
import { DocumentPathsAssembler } from './path/path.mjs';
import { PathAssemblerFactory } from './path/factory.mjs';
import './path/path-item/path-item.mjs';
import './path/path-item/operation/operation.mjs';
import './path/path-item/operation/operation-id.mjs';
import './path/path-item/operation/parameters.mjs';
import './path/path-item/operation/tags.mjs';

class DocumentAssemblerFactory {
    createAll() {
        return [
            this._createMetadataAssembler(),
            this._createInfoAssembler(),
            this._createPathsAssembler()
        ];
    }
    _createInfoAssembler() {
        return new DocumentInfoAssembler();
    }
    _createMetadataAssembler() {
        return new DocumentMetadataAssembler();
    }
    _createPathsAssembler(assemblerFactory = new PathAssemblerFactory(), contextFactory = new PathContextFactory()) {
        const assemblers = assemblerFactory.createAll();
        return new DocumentPathsAssembler(assemblers, contextFactory);
    }
}

export { DocumentAssemblerFactory };
//# sourceMappingURL=factory.mjs.map
