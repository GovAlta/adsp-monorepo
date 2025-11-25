'use strict';

var operationId = require('./operation-id.js');
var parameters = require('./parameters.js');
var responses = require('./responses.js');
var tags = require('./tags.js');
var body = require('./body.js');

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
        return new operationId.OperationIDAssembler();
    }
    _createParametersAssembler() {
        return new parameters.OperationParametersAssembler();
    }
    _createResponsesAssembler() {
        return new responses.OperationResponsesAssembler();
    }
    _createTagsAssembler() {
        return new tags.OperationTagsAssembler();
    }
    _createBodyAssembler() {
        return new body.BodyAssembler();
    }
}

exports.OperationAssemblerFactory = OperationAssemblerFactory;
//# sourceMappingURL=factory.js.map
