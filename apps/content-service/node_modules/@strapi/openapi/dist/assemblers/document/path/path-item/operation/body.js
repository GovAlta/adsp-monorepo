'use strict';

require('debug');
var zod = require('../../../../../utils/zod.js');

class BodyAssembler {
    assemble(context, route) {
        const { output } = context;
        const { body } = route.request ?? {};
        // If no `body` property is defined, we don't need to do anything
        if (!body) {
            return;
        }
        const content = {};
        for (const [media, zodSchema] of Object.entries(body)){
            content[media] = {
                schema: zod.zodToOpenAPI(zodSchema)
            };
        }
        output.data.requestBody = {
            content
        };
    }
}

exports.BodyAssembler = BodyAssembler;
//# sourceMappingURL=body.js.map
