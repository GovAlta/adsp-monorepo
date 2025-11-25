import path from 'node:path';
import { loadFile } from './files.mjs';

const getUserConfig = async (fileNames, ctx)=>{
    for (const file of fileNames){
        const filePath = path.join(ctx.appDir, 'src', 'admin', file);
        const configFile = await loadFile(filePath);
        if (configFile) {
            return configFile;
        }
    }
    return undefined;
};

export { getUserConfig };
//# sourceMappingURL=config.mjs.map
