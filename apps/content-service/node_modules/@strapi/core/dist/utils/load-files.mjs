import path from 'path';
import _ from 'lodash';
import fse from 'fs-extra';
import { importDefault } from '@strapi/utils';
import { glob } from 'glob';
import { filePathToPropPath } from './filepath-to-prop-path.mjs';

/**
 * Returns an Object build from a list of files matching a glob pattern in a directory
 * It builds a tree structure resembling the folder structure in dir
 */ const loadFiles = async (dir, pattern, // eslint-disable-next-line @typescript-eslint/no-unused-vars
{ requireFn = importDefault, shouldUseFileNameAsKey = (_)=>true, globArgs = {} } = {})=>{
    const root = {};
    const files = await glob(pattern, {
        cwd: dir,
        ...globArgs
    });
    for (const file of files){
        const absolutePath = path.resolve(dir, file);
        // load module
        delete require.cache[absolutePath];
        let mod;
        if (path.extname(absolutePath) === '.json') {
            mod = await fse.readJson(absolutePath);
        } else {
            mod = requireFn(absolutePath);
        }
        Object.defineProperty(mod, '__filename__', {
            enumerable: true,
            configurable: false,
            writable: false,
            value: path.basename(file)
        });
        const propPath = filePathToPropPath(file, shouldUseFileNameAsKey(file));
        if (propPath.length === 0) _.merge(root, mod);
        _.merge(root, _.setWith({}, propPath, mod, Object));
    }
    return root;
};

export { loadFiles };
//# sourceMappingURL=load-files.mjs.map
