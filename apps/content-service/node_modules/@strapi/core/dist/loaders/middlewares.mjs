import { join, extname, basename } from 'path';
import fse from 'fs-extra';
import { importDefault } from '@strapi/utils';
import { middlewares } from '../middlewares/index.mjs';

// TODO:: allow folders with index.js inside for bigger policies
async function loadMiddlewares(strapi) {
    const localMiddlewares = await loadLocalMiddlewares(strapi);
    strapi.get('middlewares').add(`global::`, localMiddlewares);
    strapi.get('middlewares').add(`strapi::`, middlewares);
}
const loadLocalMiddlewares = async (strapi)=>{
    const dir = strapi.dirs.dist.middlewares;
    if (!await fse.pathExists(dir)) {
        return {};
    }
    const middlewares = {};
    const paths = await fse.readdir(dir, {
        withFileTypes: true
    });
    for (const fd of paths){
        const { name } = fd;
        const fullPath = join(dir, name);
        if (fd.isFile() && extname(name) === '.js') {
            const key = basename(name, '.js');
            middlewares[key] = importDefault(fullPath);
        }
    }
    return middlewares;
};

export { loadMiddlewares as default };
//# sourceMappingURL=middlewares.mjs.map
