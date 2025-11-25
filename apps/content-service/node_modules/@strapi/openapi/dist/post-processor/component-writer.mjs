import * as z from 'zod/v4';
import { toComponentsPath } from '../utils/zod.mjs';

class ComponentsWriter {
    postProcess(context) {
        const { output } = context;
        const { schemas } = z.toJSONSchema(z.globalRegistry, {
            uri: toComponentsPath
        });
        output.data.components = {
            schemas
        };
    }
}

export { ComponentsWriter };
//# sourceMappingURL=component-writer.mjs.map
