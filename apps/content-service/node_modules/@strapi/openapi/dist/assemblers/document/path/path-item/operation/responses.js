'use strict';

require('debug');
var zod = require('../../../../../utils/zod.js');

class OperationResponsesAssembler {
    get _errors() {
        return {
            400: {
                description: 'Bad request'
            },
            401: {
                description: 'Unauthorized'
            },
            403: {
                description: 'Forbidden'
            },
            404: {
                description: 'Not found'
            },
            500: {
                description: 'Internal server error'
            }
        };
    }
    assemble(context, route) {
        const { output } = context;
        const responses = {
            ...output.data.responses
        };
        // Register common error responses first to allow manual overrides
        for (const [errorCode, response] of Object.entries(this._errors)){
            responses[errorCode] = response;
        }
        if (route.response) {
            const schema = zod.zodToOpenAPI(route.response);
            responses[200] = {
                description: 'OK',
                content: {
                    'application/json': {
                        schema
                    }
                }
            };
        }
        output.data.responses = responses;
    }
}

exports.OperationResponsesAssembler = OperationResponsesAssembler;
//# sourceMappingURL=responses.js.map
