import { createDebugger } from '../../utils/debug.mjs';
import 'node:crypto';
import 'zod/v4';

const debug = createDebugger('assembler:info');
class DocumentInfoAssembler {
    assemble(context) {
        const { name, version } = context.strapi.config.get('info');
        debug(`assembling document's info for %O...`, {
            name,
            version
        });
        const info = {
            title: this._title(name),
            description: this._description(name, version),
            version
        };
        debug(`document's info assembled: %O`, info);
        context.output.data.info = info;
    }
    _title(name) {
        return `${name}`;
    }
    _description(name, version) {
        return `API documentation for ${name} v${version}`;
    }
}

export { DocumentInfoAssembler };
//# sourceMappingURL=info.mjs.map
