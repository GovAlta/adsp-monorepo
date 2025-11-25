'use strict';

var path = require('path');
var fse = require('fs-extra');
var strapiUtils = require('@strapi/utils');
var index = require('../middlewares/index.js');

// TODO:: allow folders with index.js inside for bigger policies
async function loadMiddlewares(strapi) {
    const localMiddlewares = await loadLocalMiddlewares(strapi);
    strapi.get('middlewares').add(`global::`, localMiddlewares);
    strapi.get('middlewares').add(`strapi::`, index.middlewares);
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
        const fullPath = path.join(dir, name);
        if (fd.isFile() && path.extname(name) === '.js') {
            const key = path.basename(name, '.js');
            middlewares[key] = strapiUtils.importDefault(fullPath);
        }
    }
    return middlewares;
};

module.exports = loadMiddlewares;
//# sourceMappingURL=middlewares.js.map
