import { OperationIDAssembler } from './operation-id.mjs';
import { OperationParametersAssembler } from './parameters.mjs';
import { OperationResponsesAssembler } from './responses.mjs';
import { OperationTagsAssembler } from './tags.mjs';
import { BodyAssembler } from './body.mjs';

class OperationAssemblerFactory {
    createAll() {
        return [
            this._createOperationIDAssembler(),
            this._createParametersAssembler(),
            this._createResponsesAssembler(),
            this._createTagsAssembler(),
            this._createBodyAssembler()
        ];
    }
    _createOperationIDAssembler() {
        return new OperationIDAssembler();
    }
    _createParametersAssembler() {
        return new OperationParametersAssembler();
    }
    _createResponsesAssembler() {
        return new OperationResponsesAssembler();
    }
    _createTagsAssembler() {
        return new OperationTagsAssembler();
    }
    _createBodyAssembler() {
        return new BodyAssembler();
    }
}

export { OperationAssemblerFactory };
//# sourceMappingURL=factory.mjs.map
