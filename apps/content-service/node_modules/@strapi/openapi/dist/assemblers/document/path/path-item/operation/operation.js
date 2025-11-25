'use strict';

var openapiTypes = require('openapi-types');
var debug$1 = require('../../../../../utils/debug.js');
require('node:crypto');
require('zod/v4');
var operation = require('../../../../../context/factories/operation.js');

const debug = debug$1.createDebugger('assembler:operation');
class OperationAssembler {
    assemble(context, path, routes) {
        const { output, ...defaultContextProps } = context;
        for (const route of routes){
            const { method } = route;
            const methodIndex = method.toLowerCase();
            const operationContext = this._contextFactory.create(defaultContextProps);
            this._validateHTTPIndex(methodIndex);
            debug('assembling operation object for %o %o...', method, path);
            for (const assembler of this._assemblers){
                debug('running assembler: %s...', assembler.constructor.name);
                assembler.assemble(operationContext, route);
            }
            const { data: operationObject } = operationContext.output;
            this._validateOperationObject(operationObject);
            debug('assembled operation object for %o %o', method, path);
            Object.assign(output.data, {
                [methodIndex]: operationObject
            });
        }
    }
    _validateOperationObject(operation) {
        if (!('responses' in operation)) {
            throw new Error('Invalid operation object: missing "responses" property');
        }
    }
    _validateHTTPIndex(method) {
        // HttpMethods is exported as an enum in OpenAPIV3 and as a type only in OpenAPIV3_1
        const allowedMethods = Object.values(openapiTypes.OpenAPIV3.HttpMethods);
        const isAllowedMethod = allowedMethods.includes(method);
        if (!isAllowedMethod) {
            throw new Error(`Invalid HTTP method object: ${method}. Expected one of ${allowedMethods}`);
        }
    }
    constructor(assemblers, contextFactory = new operation.OperationContextFactory()){
        this._assemblers = assemblers;
        this._contextFactory = contextFactory;
    }
}

exports.OperationAssembler = OperationAssembler;
//# sourceMappingURL=operation.js.map
