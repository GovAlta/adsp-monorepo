import 'debug';
import { zodToOpenAPI } from '../../../../../utils/zod.mjs';

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
                schema: zodToOpenAPI(zodSchema)
            };
        }
        output.data.requestBody = {
            content
        };
    }
}

export { BodyAssembler };
//# sourceMappingURL=body.mjs.map
