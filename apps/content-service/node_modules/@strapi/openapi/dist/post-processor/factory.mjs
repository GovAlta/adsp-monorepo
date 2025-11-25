import { ComponentsWriter } from './component-writer.mjs';

class PostProcessorsFactory {
    createAll() {
        return [
            new ComponentsWriter()
        ];
    }
}

export { PostProcessorsFactory };
//# sourceMappingURL=factory.mjs.map
