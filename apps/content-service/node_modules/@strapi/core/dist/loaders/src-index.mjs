import { resolve } from 'path';
import { existsSync, statSync } from 'fs';
import { yup, importDefault } from '@strapi/utils';

const srcSchema = yup.object().shape({
    bootstrap: yup.mixed().isFunction(),
    register: yup.mixed().isFunction(),
    destroy: yup.mixed().isFunction()
}).noUnknown();
const validateSrcIndex = (srcIndex)=>{
    return srcSchema.validateSync(srcIndex, {
        strict: true,
        abortEarly: false
    });
};
var loadSrcIndex = ((strapi)=>{
    if (!existsSync(strapi.dirs.dist.src)) {
        return;
    }
    const pathToSrcIndex = resolve(strapi.dirs.dist.src, 'index.js');
    if (!existsSync(pathToSrcIndex) || statSync(pathToSrcIndex).isDirectory()) {
        return {};
    }
    const srcIndex = importDefault(pathToSrcIndex);
    try {
        validateSrcIndex(srcIndex);
    } catch (e) {
        if (e instanceof yup.ValidationError) {
            strapi.stopWithError({
                message: `Invalid file \`./src/index.js\`: ${e.message}`
            });
        }
        throw e;
    }
    strapi.app = srcIndex;
});

export { loadSrcIndex as default };
//# sourceMappingURL=src-index.mjs.map
