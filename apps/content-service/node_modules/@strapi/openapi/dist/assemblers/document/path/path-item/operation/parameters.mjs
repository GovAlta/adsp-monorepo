import { createDebugger } from '../../../../../utils/debug.mjs';
import { zodToOpenAPI } from '../../../../../utils/zod.mjs';

const debug = createDebugger('assembler:parameters');
class OperationParametersAssembler {
    assemble(context, route) {
        debug('assembling parameters for %o %o...', route.method, route.path);
        const pathParameters = this._getPathParameters(route);
        debug('found %o path parameters', pathParameters.length);
        const queryParameters = this._getQueryParameters(route);
        debug('found %o query parameters', queryParameters.length);
        const parameters = [
            ...pathParameters,
            ...queryParameters
        ];
        debug('assembled %o parameters for %o %o', parameters.length, route.method, route.path);
        context.output.data.parameters = parameters;
    }
    _getPathParameters(route) {
        const { params } = route.request ?? {};
        // TODO: Allow auto inference (from path) if enabled through configuration
        if (!params) {
            return [];
        }
        const pathParams = [];
        for (const [name, zodSchema] of Object.entries(params)){
            const required = !zodSchema.isOptional();
            const schema = zodToOpenAPI(zodSchema);
            pathParams.push({
                name,
                in: 'path',
                required,
                schema
            });
        }
        return pathParams;
    }
    _getQueryParameters(route) {
        const { query } = route.request ?? {};
        if (!query) {
            return [];
        }
        const queryParams = [];
        for (const [name, zodSchema] of Object.entries(query)){
            const required = !zodSchema.isOptional();
            const schema = zodToOpenAPI(zodSchema);
            const param = {
                name,
                in: 'query',
                required,
                schema
            };
            // In Strapi, query params are always interpreted as query strings, which isn't supported by the specification
            // TODO: Make that configurable somehow
            Object.assign(param, {
                'x-strapi-serialize': 'querystring'
            });
            queryParams.push(param);
        }
        return queryParams;
    }
}

export { OperationParametersAssembler };
//# sourceMappingURL=parameters.mjs.map
