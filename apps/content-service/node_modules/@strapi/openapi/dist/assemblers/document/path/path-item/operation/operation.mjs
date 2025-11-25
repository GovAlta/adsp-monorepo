import { OpenAPIV3 } from 'openapi-types';
import { createDebugger } from '../../../../../utils/debug.mjs';
import 'node:crypto';
import 'zod/v4';
import { OperationContextFactory } from '../../../../../context/factories/operation.mjs';

const debug = createDebugger('assembler:operation');
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
        const allowedMethods = Object.values(OpenAPIV3.HttpMethods);
        const isAllowedMethod = allowedMethods.includes(method);
        if (!isAllowedMethod) {
            throw new Error(`Invalid HTTP method object: ${method}. Expected one of ${allowedMethods}`);
        }
    }
    constructor(assemblers, contextFactory = new OperationContextFactory()){
        this._assemblers = assemblers;
        this._contextFactory = contextFactory;
    }
}

export { OperationAssembler };
//# sourceMappingURL=operation.mjs.map
