'use strict';

var path = require('path');
var _ = require('lodash');
var fse = require('fs-extra');
var strapiUtils = require('@strapi/utils');
var glob = require('glob');
var filepathToPropPath = require('./filepath-to-prop-path.js');

/**
 * Returns an Object build from a list of files matching a glob pattern in a directory
 * It builds a tree structure resembling the folder structure in dir
 */ const loadFiles = async (dir, pattern, // eslint-disable-next-line @typescript-eslint/no-unused-vars
{ requireFn = strapiUtils.importDefault, shouldUseFileNameAsKey = (_)=>true, globArgs = {} } = {})=>{
    const root = {};
    const files = await glob.glob(pattern, {
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
        const propPath = filepathToPropPath.filePathToPropPath(file, shouldUseFileNameAsKey(file));
        if (propPath.length === 0) _.merge(root, mod);
        _.merge(root, _.setWith({}, propPath, mod, Object));
    }
    return root;
};

exports.loadFiles = loadFiles;
//# sourceMappingURL=load-files.js.map
