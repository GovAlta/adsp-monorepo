import path from 'path';
import fs from 'fs';
import { importDefault, env } from '@strapi/utils';

const loadJsFile = (file)=>{
    try {
        const jsModule = importDefault(file);
        // call if function
        if (typeof jsModule === 'function') {
            return jsModule({
                env
            });
        }
        return jsModule;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Could not load js config file ${file}: ${error.message}`);
        }
        throw new Error('Unknown error');
    }
};
const loadJSONFile = (file)=>{
    try {
        return JSON.parse(fs.readFileSync(file).toString());
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Could not load json config file ${file}: ${error.message}`);
        }
        throw new Error('Unknown error');
    }
};
const loadConfigFile = (file)=>{
    const ext = path.extname(file);
    switch(ext){
        case '.js':
            return loadJsFile(file);
        case '.json':
            return loadJSONFile(file);
        default:
            return {};
    }
};

export { loadConfigFile };
//# sourceMappingURL=load-config-file.mjs.map
